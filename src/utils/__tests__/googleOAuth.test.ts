import * as fc from 'fast-check';
import { extractGoogleToken } from '@utils/googleOAuth';

describe('extractGoogleToken', () => {
  it('extracts token from #google_token= fragment', () => {
    expect(extractGoogleToken('https://example.com/callback#google_token=abc123')).toBe('abc123');
  });

  it('returns null for URL with google_error in query string', () => {
    expect(extractGoogleToken('https://example.com/callback?google_error=auth_failed')).toBeNull();
  });

  it('returns null for URL with no fragment', () => {
    expect(extractGoogleToken('https://example.com/callback')).toBeNull();
  });

  it('returns null for URL with unknown fragment', () => {
    expect(extractGoogleToken('https://example.com/callback#some_other_param=value')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractGoogleToken('')).toBeNull();
  });

  it('handles token with URL-safe characters', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    expect(extractGoogleToken(`https://example.com/cb#google_token=${token}`)).toBe(token);
  });

  /**
   * P2 — Ekstraksi Google OAuth token dari URL
   * Validates: Requirements 2.3, 2.4
   */
  describe('P2 — extractGoogleToken property tests', () => {
    // Tokens that don't contain characters that would break URL fragment parsing.
    // Exclude '#', '&', '=', '+' (structural delimiters), '%' (percent-encoding sequences
    // would be decoded by URLSearchParams causing round-trip mismatch), and null bytes.
    const safeTokenArb = fc
      .string({ minLength: 1 })
      .filter(
        s =>
          !s.includes('#') &&
          !s.includes('&') &&
          !s.includes('=') &&
          !s.includes('+') &&
          !s.includes('%') &&
          !s.includes('\0'),
      );

    it('URL with #google_token=TOKEN always returns TOKEN', () => {
      fc.assert(
        fc.property(safeTokenArb, token => {
          const url = `https://example.com/callback#google_token=${token}`;
          return extractGoogleToken(url) === token;
        }),
        { numRuns: 100 },
      );
    });

    it('URL with ?google_error= (no fragment) always returns null', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('auth_failed', 'no_email', 'unknown'),
          errorCode => {
            const url = `https://example.com/callback?google_error=${errorCode}`;
            return extractGoogleToken(url) === null;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('URL with no fragment always returns null', () => {
      fc.assert(
        fc.property(
          fc.webUrl().filter(u => !u.includes('#')),
          url => extractGoogleToken(url) === null,
        ),
        { numRuns: 100 },
      );
    });
  });
});
