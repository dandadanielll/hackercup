export const RESOURCE_TYPES = ['Module', 'Lesson Plan'] as const;
export const SUBJECTS = ['Numeracy', 'Literacy', 'Science', 'Filipino'] as const;
export const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'] as const;
export const MAX_RESOURCE_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export type ResourceType = typeof RESOURCE_TYPES[number];
export type Subject = typeof SUBJECTS[number];
export type Grade = typeof GRADES[number];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/**
 * Validates a file for LokalBank upload.
 * Returns an error string if invalid, or null if the file is acceptable.
 */
export function validateResourceFile(file: File): string | null {
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
  const hasValidExt = ALLOWED_EXTENSIONS.includes(ext);
  const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type);

  if (!hasValidExt && !hasValidMime) {
    return 'Only PDF, DOCX, or TXT files are accepted.';
  }

  if (file.size > MAX_RESOURCE_FILE_BYTES) {
    return 'File exceeds the 5 MB limit. Please upload a smaller file.';
  }

  return null;
}
