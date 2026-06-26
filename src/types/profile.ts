import type { Violation } from './violation';

export interface UserProfile {
  id: number;
  name: string;
  age?: number;
  department?: string;
  position?: string;
  photo?: string;
}

export interface ProfileStats {
  total_reports: number;
  points: number;
  rank: number;
  streak_days: number;
  reports_today: number;
}

export interface ProfileResponse {
  profile: UserProfile;
  stats: ProfileStats;
  history: Violation[];
}
