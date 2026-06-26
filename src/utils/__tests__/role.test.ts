import * as fc from 'fast-check';
import type { Rule } from '@/types/rule';
import type { MembershipRole } from '@/types/room';
import { isAdmin, isReporter, filterRulesForRole } from '@utils/role';

describe('isAdmin', () => {
  it('returns true for "admin"', () => {
    expect(isAdmin('admin')).toBe(true);
  });

  it('returns false for "reporter"', () => {
    expect(isAdmin('reporter')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe('isReporter', () => {
  it('returns true for "reporter"', () => {
    expect(isReporter('reporter')).toBe(true);
  });

  it('returns false for "admin"', () => {
    expect(isReporter('admin')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isReporter(null)).toBe(false);
  });
});

describe('filterRulesForRole', () => {
  const rules: Rule[] = [
    { id: 1, name: 'Rule A', admin_only: false, created_at: '2024-01-01' },
    { id: 2, name: 'Rule B', admin_only: true, created_at: '2024-01-02' },
    { id: 3, name: 'Rule C', admin_only: false, created_at: '2024-01-03' },
  ];

  it('returns all rules for admin', () => {
    expect(filterRulesForRole(rules, 'admin')).toHaveLength(3);
  });

  it('excludes admin_only rules for reporter', () => {
    const result = filterRulesForRole(rules, 'reporter');
    expect(result).toHaveLength(2);
    expect(result.every((r) => !r.admin_only)).toBe(true);
  });

  it('excludes admin_only rules for null role', () => {
    const result = filterRulesForRole(rules, null);
    expect(result.every((r) => !r.admin_only)).toBe(true);
  });

  it('returns empty array when input is empty', () => {
    expect(filterRulesForRole([], 'reporter')).toEqual([]);
    expect(filterRulesForRole([], 'admin')).toEqual([]);
  });

  /**
   * P3 — Filter rules berdasarkan role
   * Validates: Requirements 6.4, 6.5
   */
  describe('P3 — filterRulesForRole property tests', () => {
    const ruleArb = fc.record({
      id: fc.nat(),
      name: fc.string(),
      admin_only: fc.boolean(),
      created_at: fc.string(),
    });

    it('reporter result never contains admin_only rules', () => {
      fc.assert(
        fc.property(fc.array(ruleArb), (rules) => {
          const result = filterRulesForRole(rules as Rule[], 'reporter');
          return !result.some((r) => r.admin_only);
        }),
        { numRuns: 100 }
      );
    });

    it('admin result has same length as input', () => {
      fc.assert(
        fc.property(fc.array(ruleArb), (rules) => {
          return filterRulesForRole(rules as Rule[], 'admin').length === rules.length;
        }),
        { numRuns: 100 }
      );
    });
  });
});
