import type { MembershipRole } from '../types/room';
import type { Rule } from '../types/rule';

export const isAdmin = (role: MembershipRole | null): boolean => role === 'admin';
export const isReporter = (role: MembershipRole | null): boolean => role === 'reporter';
export function filterRulesForRole(rules: Rule[], role: MembershipRole | null): Rule[] {
  if (role === 'admin') return rules;
  return rules.filter(rule => !rule.admin_only);
}
