export interface DashboardStats {
  total_violations?: number;
  total_violation?: number;
  pending_violations?: number;
  verified_violations?: number;
  total_members?: number;
  reports_today?: number;
  reports_this_week?: number;
  total_points_log?: number;
  my_points?: number;
  my_rank?: number;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  photo?: string;
  department?: string;
  points: number;
  total_points?: number;
  rank: number;
  badge?: 'gold' | 'silver' | 'bronze' | string;
}

export interface LeaderboardResponse {
  data: LeaderboardEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
