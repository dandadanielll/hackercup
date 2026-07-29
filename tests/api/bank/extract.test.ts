import { describe, expect, it } from 'vitest';
import { POST } from '@/src/app/api/extract/route';
import { NextRequest } from 'next/server';

function mockFormDataRequest(formData: FormData): NextRequest {
  return {
    headers: new Headers({ 'content-type': 'multipart/form-data; boundary=----TestBoundary' }),
    formData: async () => formData,
  } as unknown as NextRequest;
}

describe('POST /api/extract', () => {
  it('returns 400 with stage: extraction when multipart data does not contain a file', async () => {
    const formData = new FormData();
    const req = mockFormDataRequest(formData);

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({ stage: 'extraction', error: expect.any(String) });
  });

  it('returns 413 before parsing a file larger than 5 MB', async () => {
    const largeData = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([largeData], 'too-large.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);

    const req = mockFormDataRequest(formData);

    const res = await POST(req);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toMatchObject({ stage: 'extraction', error: expect.stringMatching(/5 MB/) });
  });

  it('extracts plain text successfully', async () => {
    const file = new File(['Ang Panahon sa Bicol'], 'lesson.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);

    const req = mockFormDataRequest(formData);

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.extractedText).toBe('Ang Panahon sa Bicol');
    expect(body.fileName).toBe('lesson.txt');
  });
});

