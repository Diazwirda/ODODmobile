import { getClient } from './clients';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import type { DashboardStats, LeaderboardEntry, LeaderboardResponse } from '../types/dashboard';

const activeClient = () => {
  const { activeBackend } = useMultiAuthStore.getState();
  if (!activeBackend) {
    throw new Error('Belum login ke backend aktif.');
  }
  return getClient(activeBackend);
};

export const dashboardApi = {
  stats: () => activeClient().get<DashboardStats>('/dashboard/stats'),

  leaderboard: (params?: {
    period?: string;
    sort?: string;
    department?: string;
    search?: string;
    page?: number;
    per_page?: number;
    limit?: number;
  }) =>
    activeClient().get<LeaderboardEntry[] | LeaderboardResponse>('/dashboard/leaderboard', { params }),
};
