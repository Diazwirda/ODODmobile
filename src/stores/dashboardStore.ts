/**
 * dashboardStore — task 11.1
 *
 * Manages dashboard statistics and leaderboard state for the active room.
 * Leaderboard filters are stored here and updated via setFilters() without
 * triggering an automatic re-fetch — callers are responsible for invoking
 * fetchLeaderboard() after updating filters.
 */

import { create } from 'zustand';
import apiClient from '@api/client';
import type { DashboardStats, LeaderboardResponse, LeaderboardFilters } from '@/types/dashboard';

interface DashboardStore {
  stats: DashboardStats | null;
  leaderboard: LeaderboardResponse | null;
  leaderboardFilters: LeaderboardFilters;
  isLoading: boolean;

  fetchStats: (roomId: number) => Promise<void>;
  fetchLeaderboard: (roomId: number, filters: LeaderboardFilters) => Promise<void>;
  setFilters: (filters: Partial<LeaderboardFilters>) => void;
}

const DEFAULT_FILTERS: LeaderboardFilters = {
  period: 'all-time',
  department: '',
  sort: 'desc',
  per_page: 10,
  page: 1,
};

export const useDashboardStore = create<DashboardStore>()((set) => ({
  stats: null,
  leaderboard: null,
  leaderboardFilters: DEFAULT_FILTERS,
  isLoading: false,

  /**
   * Fetches dashboard statistics for the given room.
   * GET /rooms/{roomId}/dashboard/stats
   */
  fetchStats: async (roomId: number): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get<DashboardStats>(`/rooms/${roomId}/dashboard/stats`);
      set({ stats: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Fetches leaderboard data for the given room, applying the provided filters
   * as query parameters.
   * GET /rooms/{roomId}/dashboard/leaderboard
   */
  fetchLeaderboard: async (roomId: number, filters: LeaderboardFilters): Promise<void> => {
    set({ isLoading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        period: filters.period,
        sort: filters.sort,
        per_page: filters.per_page,
        page: filters.page,
        // Omit department when empty so the backend returns all departments
        department: filters.department || undefined,
      };

      const { data } = await apiClient.get<LeaderboardResponse>(
        `/rooms/${roomId}/dashboard/leaderboard`,
        { params }
      );
      set({ leaderboard: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Merges partial filter updates into the current leaderboardFilters state.
   * Does NOT trigger a fetch — callers must call fetchLeaderboard() explicitly.
   */
  setFilters: (filters: Partial<LeaderboardFilters>): void => {
    set((state) => ({
      leaderboardFilters: { ...state.leaderboardFilters, ...filters },
    }));
  },
}));
