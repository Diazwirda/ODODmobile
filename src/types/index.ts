// Barrel export for all TypeScript interfaces and types

export type { AuthUser, AuthResponse, RegisterPayload, LoginPayload } from './auth';

export type { ImageFile, Department, NormalizedError } from './common';

export type {
  MembershipRole,
  InviteCodeType,
  Room,
  RoomAdmin,
  CreateRoomPayload,
  UpdateRoomPayload,
} from './room';

export type { Rule, ArchivedRule, CreateRulePayload } from './rule';

export type {
  ViolationStatus,
  ViolationUser,
  Violation,
  CreateViolationPayload,
  UpdateViolationStatusPayload,
} from './violation';

export type {
  DashboardStats,
  LeaderboardPeriod,
  BadgeTier,
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardFilters,
} from './dashboard';

export type { UserProfile, ProfileStats, ProfileResponse } from './profile';
