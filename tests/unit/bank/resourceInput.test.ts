import { describe, expect, it } from 'vitest';
import { validateResourceFile, MAX_RESOURCE_FILE_BYTES } from '@/src/lib/bank/resourceInput';

describe('validateResourceFile', () => {
  it('accepts a small TXT file', () => {
    const f = new File(['lesson content'], 'lesson.txt', { type: 'text/plain' });
    expect(validateResourceFile(f)).toBeNull();
  });

  it('accepts a PDF by extension even if MIME is generic', () => {
    const f = new File(['%PDF'], 'module.pdf', { type: 'application/octet-stream' });
    expect(validateResourceFile(f)).toBeNull();
  });

  it('accepts a DOCX by MIME even if extension is unknown', () => {
    const f = new File(['data'], 'lesson',
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    expect(validateResourceFile(f)).toBeNull();
  });

  it('rejects an unsupported extension with no valid MIME', () => {
    const result = validateResourceFile(
      new File(['x'], 'lesson.exe', { type: 'application/octet-stream' })
    );
    expect(result).toMatch(/PDF, DOCX, or TXT/);
  });

  it('rejects a file exactly 1 byte over the 5 MB limit', () => {
    const data = new Uint8Array(MAX_RESOURCE_FILE_BYTES + 1);
    const result = validateResourceFile(
      new File([data], 'large.txt', { type: 'text/plain' })
    );
    expect(result).toMatch(/5 MB/);
  });

  it('accepts a file at exactly the 5 MB limit', () => {
    const data = new Uint8Array(MAX_RESOURCE_FILE_BYTES);
    const f = new File([data], 'exact.txt', { type: 'text/plain' });
    expect(validateResourceFile(f)).toBeNull();
  });
});
