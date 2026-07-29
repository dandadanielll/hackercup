import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/lib/supabase';

// GET /api/bank/export?id=...&format=pdf|txt
// Public: stream the latest resource content as a file download
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const format = searchParams.get('format') ?? 'txt';

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('bank_resources')
      .select('title, content_text')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const safeTitle = data.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().slice(0, 80);

    if (format === 'txt') {
      return new NextResponse(data.content_text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeTitle}.txt"`,
        },
      });
    }

    // PDF: generate a minimal text-based PDF without external deps
    // Uses the PDF structure directly to keep bundle size small
    const escapePdf = (text: string) =>
      text
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');

    const lines = data.content_text.split('\n');
    const pageWidth = 595;   // A4 points width
    const pageHeight = 842;  // A4 points height
    const margin = 50;
    const lineHeight = 14;
    const maxWidth = pageWidth - margin * 2;
    const charsPerLine = Math.floor(maxWidth / 6); // approx 6pt per char in Courier 10

    // Word-wrap
    const wrappedLines: string[] = [];
    for (const line of lines) {
      if (line.length === 0) { wrappedLines.push(''); continue; }
      let remaining = line;
      while (remaining.length > charsPerLine) {
        const cut = remaining.lastIndexOf(' ', charsPerLine);
        const breakAt = cut > 0 ? cut : charsPerLine;
        wrappedLines.push(remaining.slice(0, breakAt));
        remaining = remaining.slice(breakAt + 1);
      }
      wrappedLines.push(remaining);
    }

    // Chunk into pages
    const linesPerPage = Math.floor((pageHeight - margin * 2 - 30) / lineHeight);
    const pages: string[][] = [];
    for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
      pages.push(wrappedLines.slice(i, i + linesPerPage));
    }
    if (pages.length === 0) pages.push([]);

    // Build PDF objects
    const objects: string[] = [];
    let objNum = 1;

    const addObj = (content: string) => {
      objects.push(`${objNum} 0 obj\n${content}\nendobj`);
      return objNum++;
    };

    // Catalog + Pages will be set after we know page object numbers
    const catalogId = objNum++;
    const pagesId = objNum++;

    const pageIds: number[] = [];
    const contentIds: number[] = [];

    for (const pageLines of pages) {
      const contentId = objNum;
      let stream = `BT\n/F1 10 Tf\n${lineHeight} TL\n${margin} ${pageHeight - margin - 20} Td\n`;

      // Title on first page
      if (pageLines === pages[0]) {
        stream += `12 TL\n(${escapePdf(data.title.slice(0, 80))}) Tj T*\n10 TL\n`;
      }

      for (const l of pageLines) {
        stream += `(${escapePdf(l.slice(0, charsPerLine + 10))}) Tj T*\n`;
      }
      stream += 'ET';

      const streamBytes = Buffer.from(stream, 'utf-8');
      addObj(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);
      contentIds.push(contentId);

      const pageId = objNum;
      addObj(`<< /Type /Page /Parent ${pagesId} 0 R /Contents ${contentId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] >>`);
      pageIds.push(pageId);
    }

    const fontId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>`);

    // Pages dict
    objects.splice(pagesId - 1, 0, `${pagesId} 0 obj\n<< /Type /Pages /Kids [${pageIds.map(i => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} /Resources << /Font << /F1 ${fontId} 0 R >> >> >>\nendobj`);

    // Catalog
    objects.splice(catalogId - 1, 0, `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj`);

    // Build xref
    let body = '%PDF-1.4\n';
    const offsets: number[] = [];
    const sortedObjects = objects.slice().sort((a, b) => {
      const numA = parseInt(a.split(' ')[0]);
      const numB = parseInt(b.split(' ')[0]);
      return numA - numB;
    });

    for (const obj of sortedObjects) {
      offsets.push(body.length);
      body += obj + '\n';
    }

    const xrefOffset = body.length;
    const totalObjects = sortedObjects.length + 1;
    body += `xref\n0 ${totalObjects}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      body += `${String(off).padStart(10, '0')} 00000 n \n`;
    }
    body += `trailer\n<< /Size ${totalObjects} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('GET /api/bank/export error:', err);
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
