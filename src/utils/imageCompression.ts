import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Photos below this size are left untouched — compression only kicks in
// when it's actually needed.
const COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const COMPRESS_QUALITY = 0.7;

export interface CompressibleImage {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

/**
 * Downscales and re-compresses a photo as JPEG when it's larger than
 * COMPRESS_THRESHOLD_BYTES, instead of just rejecting it for being too big.
 * expo-image-manipulator doesn't report the resulting file size, so the
 * returned `size` is left undefined — callers should treat that as "unknown,
 * but safely small" rather than re-running a strict size check.
 */
export async function compressImageIfNeeded(image: CompressibleImage): Promise<CompressibleImage> {
  if (!image.size || image.size <= COMPRESS_THRESHOLD_BYTES) {
    return image;
  }

  const result = await manipulateAsync(
    image.uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: SaveFormat.JPEG },
  );

  return {
    uri: result.uri,
    type: 'image/jpeg',
    name: image.name.replace(/\.\w+$/, '.jpg'),
    size: undefined,
  };
}
