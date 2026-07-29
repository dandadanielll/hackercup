import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { validateResourceFile, MAX_RESOURCE_FILE_BYTES } from '@/src/lib/bank/resourceInput';

// Resilient PDF text extractor using pdfjs-dist directly (no canvas/worker binary issues)
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);

  // Strategy 1: Direct pdfjs-dist extraction
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });
    const doc = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str ?? '');
      fullText += strings.join(' ') + '\n';
    }
    if (fullText.trim()) {
      return fullText.trim();
    }
  } catch (pdfjsErr) {
    console.warn('pdfjs-dist strategy failed, trying pdf-parse:', pdfjsErr);
  }

  // Strategy 2: pdf-parse module fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParseModule = require('pdf-parse');
    if ((pdfParseModule as any).PDFParse) {
      const parser = new (pdfParseModule as any).PDFParse(uint8);
      await parser.load();
      const result = await parser.getText();
      const text = typeof result === 'string' ? result : (result?.text ?? '');
      if (text.trim()) return text.trim();
    }
  } catch (pdfParseErr) {
    console.warn('pdf-parse strategy failed, trying raw stream extraction:', pdfParseErr);
  }

  // Strategy 3: Raw stream text pattern extraction (guarantees non-empty text for any text-bearing PDF)
  try {
    const raw = buffer.toString('binary');
    const matches: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRegex.exec(raw)) !== null) {
      if (m[1] && m[1].trim().length > 0) {
        matches.push(m[1]);
      }
    }
    if (matches.length > 0) {
      return matches.join(' ').trim();
    }
  } catch (rawErr) {
    console.warn('Raw extraction failed:', rawErr);
  }

  throw new Error('Could not extract text from this PDF file. Please ensure it contains readable text or try a .docx/.txt file.');
}

export async function POST(req: NextRequest) {
  try {
    let extractedText = '';
    let fileName = 'Uploaded_Document.txt';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Choose a PDF, DOCX, or TXT file.', stage: 'extraction' }, { status: 400 });
      }

      if (file.size > MAX_RESOURCE_FILE_BYTES) {
        return NextResponse.json({ error: 'File exceeds the 5 MB limit. Please upload a smaller file.', stage: 'extraction' }, { status: 413 });
      }

      const validationError = validateResourceFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError, stage: 'extraction' }, { status: 400 });
      }

      fileName = file.name;
      const mimeType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        extractedText = await parsePdfBuffer(buffer);
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.toLowerCase().endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else {
        extractedText = buffer.toString('utf-8');
      }
    } else {
      const body = await req.json();
      if (body.text) {
        extractedText = body.text;
        fileName = body.fileName || 'Direct_Input.txt';
      } else if (body.base64 && body.fileName) {
        fileName = body.fileName;
        const base64Data = body.base64.replace(/^data:.*;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        if (fileName.toLowerCase().endsWith('.pdf')) {
          extractedText = await parsePdfBuffer(buffer);
        } else if (fileName.toLowerCase().endsWith('.docx')) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else {
          extractedText = buffer.toString('utf-8');
        }
      } else {
        return NextResponse.json({ error: 'No file or text provided', stage: 'extraction' }, { status: 400 });
      }
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/-- \d+ of \d+ --/g, '')
      .replace(/\r\n/g, '\n')
      .trim();

    if (!extractedText) {
      return NextResponse.json(
        { error: 'The uploaded file appears to be empty or contains no extractable text.', stage: 'extraction' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      extractedText,
      fileName,
      charCount: extractedText.length,
    });
  } catch (error: any) {
    console.error('Extraction handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract text from file', stage: 'extraction' },
      { status: 500 }
    );
  }
}

