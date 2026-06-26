import * as fc from 'fast-check';
import { checkTokenNeedsRefresh } from '@services/secureStorage';

// saveToken / getToken / removeToken depend on react-native-keychain (native module).
// We test the pure logic function checkTokenNeedsRefresh here.

describe('checkTokenNeedsRefresh', () => {
  it('returns true when remaining seconds equal the threshold (300)', () => {
    expect(checkTokenNeedsRefresh(300)).toBe(true);
  });

  it('returns true when remaining seconds are below the threshold', () => {
    expect(checkTokenNeedsRefresh(0)).toBe(true);
    expect(checkTokenNeedsRefresh(1)).toBe(true);
    expect(checkTokenNeedsRefresh(299)).toBe(true);
  });

  it('returns false when remaining seconds are above the threshold', () => {
    expect(checkTokenNeedsRefresh(301)).toBe(false);
    expect(checkTokenNeedsRefresh(3600)).toBe(false);
  });

  it('respects a custom threshold', () => {
    expect(checkTokenNeedsRefresh(60, 60)).toBe(true);
    expect(checkTokenNeedsRefresh(61, 60)).toBe(false);
  });

  /**
   * P1 — Token refresh berdasarkan expiry
   * Validates: Requirements 1.8, 1.9
   */
  describe('P1 — checkTokenNeedsRefresh property test', () => {
    it('returns true if and only if remainingSeconds <= 300', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 3600 }), (remainingSeconds) => {
          return checkTokenNeedsRefresh(remainingSeconds) === remainingSeconds <= 300;
        }),
        { numRuns: 100 }
      );
    });
  });
});
