import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// pdf-parse is CommonJS-only — must use require() in Next.js App Router
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;

export async function POST(req: NextRequest) {
  try {
    let extractedText = '';
    let fileName = 'Uploaded_Document.txt';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (file) {
        fileName = file.name;
        const mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
          const parsed = await pdfParse(buffer);
          extractedText = parsed.text;
        } else if (
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileName.endsWith('.docx')
        ) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else {
          extractedText = buffer.toString('utf-8');
        }
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

        if (fileName.endsWith('.pdf')) {
          const parsed = await pdfParse(buffer);
          extractedText = parsed.text;
        } else if (fileName.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } else {
          extractedText = buffer.toString('utf-8');
        }
      } else {
        return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
      }
    }

    // Clean up extracted text
    extractedText = extractedText.replace(/\r\n/g, '\n').trim();

    if (!extractedText) {
      return NextResponse.json({ error: 'Could not extract text from the file.' }, { status: 400 });
    }

    return NextResponse.json({
      extractedText,
      fileName,
      charCount: extractedText.length,
    });
  } catch (error: any) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract text from file' }, { status: 500 });
  }
}
