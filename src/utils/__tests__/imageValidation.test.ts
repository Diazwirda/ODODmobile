import * as fc from 'fast-check';
import type { ImageFile } from '@/types/common';
import { validateImageFile } from '@utils/imageValidation';

const makeFile = (overrides: Partial<ImageFile> = {}): ImageFile => ({
  uri: 'file://test.jpg',
  type: 'image/jpeg',
  name: 'test.jpg',
  size: 1024 * 1024, // 1 MB
  ...overrides,
});

describe('validateImageFile', () => {
  it('returns valid for jpeg within size limit', () => {
    expect(validateImageFile(makeFile(), 5).valid).toBe(true);
  });

  it('returns valid for png within size limit', () => {
    expect(validateImageFile(makeFile({ type: 'image/png' }), 5).valid).toBe(true);
  });

  it('returns valid for webp within size limit', () => {
    expect(validateImageFile(makeFile({ type: 'image/webp' }), 5).valid).toBe(true);
  });

  it('returns invalid when file size exceeds maxSizeMB', () => {
    const bigFile = makeFile({ size: 6 * 1024 * 1024 }); // 6 MB
    const result = validateImageFile(bigFile, 5);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns valid when file size is exactly at the limit', () => {
    const exactFile = makeFile({ size: 5 * 1024 * 1024 }); // exactly 5 MB
    expect(validateImageFile(exactFile, 5).valid).toBe(true);
  });

  it('returns invalid error message mentioning MB', () => {
    const bigFile = makeFile({ size: 10 * 1024 * 1024 });
    const result = validateImageFile(bigFile, 5);
    expect(result.error).toMatch(/5 MB/);
  });

  /**
   * P4 — Validasi ukuran dan format file foto
   * Validates: Requirements 8.5, 8.6, 12.7, 12.8
   */
  describe('P4 — validateImageFile property tests', () => {
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'] as const;

    it('invalid MIME type always produces invalid result', () => {
      const invalidMimeArb = fc
        .string()
        .filter((s) => !validMimes.includes(s as (typeof validMimes)[number]));

      fc.assert(
        fc.property(
          invalidMimeArb,
          fc.integer({ min: 0, max: 5 * 1024 * 1024 }),
          (mimeType, size) => {
            const file: ImageFile = {
              uri: 'file://test',
              // Cast to bypass TS — we intentionally test invalid MIME
              type: mimeType as ImageFile['type'],
              name: 'test',
              size,
            };
            return validateImageFile(file, 5).valid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('size > maxSizeMB always produces invalid result (valid MIME)', () => {
      const maxSizeMB = 5;
      const maxBytes = maxSizeMB * 1024 * 1024;

      fc.assert(
        fc.property(
          fc.integer({ min: maxBytes + 1, max: maxBytes * 10 }),
          fc.constantFrom(...validMimes),
          (size, mimeType) => {
            const file = makeFile({ size, type: mimeType });
            return validateImageFile(file, maxSizeMB).valid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid MIME + size within limit always produces valid result', () => {
      const maxSizeMB = 5;
      const maxBytes = maxSizeMB * 1024 * 1024;

      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: maxBytes }),
          fc.constantFrom(...validMimes),
          (size, mimeType) => {
            const file = makeFile({ size, type: mimeType });
            return validateImageFile(file, maxSizeMB).valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
