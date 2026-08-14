/**
 * Shared color tokens.
 *
 * PRIMARY is the single accent for buttons, active states, links, and badges.
 * SUCCESS/DANGER/WARNING are semantic status colors (verified/rejected/pending)
 * and are intentionally kept separate from PRIMARY — don't reuse them for
 * plain call-to-action buttons.
 */
export const COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryTint: '#DBEAFE',
  primarySoftTint: '#EFF6FF',

  success: '#10B981',
  successTint: '#DCFCE7',
  danger: '#EF4444',
  dangerTint: '#FEF2F2',
  warning: '#F59E0B',
  warningTint: '#FEF3C7',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  bg: '#F9FAFB',
  surface: '#FFFFFF',
  border: '#E5E7EB',
};

export const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
};
