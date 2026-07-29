import { NextResponse } from 'next/server';
const { PDFParse } = require('pdf-parse');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const parser = new PDFParse({ data: buffer, isWorker: false });
    const pdfData = await parser.getText();
    await parser.destroy();
    
    return NextResponse.json({ text: pdfData.text });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while parsing the PDF' },
      { status: 500 }
    );
  }
}
