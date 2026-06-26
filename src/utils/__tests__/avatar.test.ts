import * as fc from 'fast-check';
import { getInitials } from '@utils/avatar';

describe('getInitials', () => {
  it('returns two-letter initials for two-word names', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('returns single initial for single-word name', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('uses first two words only for names with more than two words', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(getInitials('   ')).toBe('');
    expect(getInitials('')).toBe('');
  });

  it('handles extra whitespace between words', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD');
  });

  it('uppercases the initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  /**
   * P7 — Avatar fallback dari inisial nama
   * Validates: Requirements 17.7
   */
  describe('P7 — getInitials property tests', () => {
    it('same name always returns same initials (deterministic)', () => {
      fc.assert(
        fc.property(fc.string(), name => {
          return getInitials(name) === getInitials(name);
        }),
        { numRuns: 100 },
      );
    });

    it('non-empty trimmed name never returns empty initials', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.trim().length > 0),
          name => {
            return getInitials(name).length > 0;
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
