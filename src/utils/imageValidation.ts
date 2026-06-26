import type { ImageFile } from '../types/common';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(
  file: ImageFile,
  maxSizeMB: number,
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format foto harus jpg, jpeg, png, atau webp.' };
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Ukuran foto maksimal ${maxSizeMB} MB per file.` };
  }
  return { valid: true };
}
