import type { Department } from './common';
import type { Violation } from './violation';

export interface DashboardStats {
  reports_today: number;
  reports_this_week: number;
  total_violation: number;
  total_points_log: number;
  departments: Department[];
}

export type LeaderboardPeriod = 'all-time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type BadgeTier = 'gold' | 'silver' | 'bronze' | null;

export interface LeaderboardEntry {
  id: number;
  name: string;
  department?: string;
  photo?: string;
  total_points: number;
  rank: number;
  badge: BadgeTier;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LeaderboardFilters {
  period: LeaderboardPeriod;
  department: string;
  sort: 'asc' | 'desc';
  per_page: number;
  page: number;
}

// Re-export Violation for dashboard usage (profile history uses it)
export type { Violation };
