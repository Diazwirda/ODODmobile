export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PHOTOS = 3;

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(
  type: string,
  size?: number,
): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(type.toLowerCase())) {
    return {
      valid: false,
      error: 'Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.',
    };
  }
  if (size !== undefined && size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran foto maksimal 5 MB.',
    };
  }
  return { valid: true };
}

export function validatePhotoCount(count: number): ImageValidationResult {
  if (count > MAX_PHOTOS) {
    return {
      valid: false,
      error: `Maksimal ${MAX_PHOTOS} foto yang dapat diunggah.`,
    };
  }
  if (count < 1) {
    return {
      valid: false,
      error: 'Minimal 1 foto harus diunggah.',
    };
  }
  return { valid: true };
}
