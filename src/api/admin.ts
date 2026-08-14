import { getClient } from './clients';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import { getBackendConfig } from '../config/backends';
import * as SecureStorage from '../services/secureStorage';
import type { AdminUser, ManualPointsPayload, Department } from '../types/admin';
import type { Violation, UpdateViolationStatusPayload } from '../types/violation';
import type { Rule, CreateRulePayload } from '../types/rule';
import type { PaginatedResponse } from '../types/common';
import type { Room } from '../types/room';

const activeClient = () => {
  const { activeBackend } = useMultiAuthStore.getState();
  if (!activeBackend) {
    throw new Error('Belum login ke backend aktif.');
  }
  return getClient(activeBackend);
};

export const adminApi = {
  // Users
  getUsers: (page = 1) =>
    activeClient().get<PaginatedResponse<AdminUser>>('/admin/users', { params: { page } }),

  updateUser: (userId: number, data: Partial<AdminUser>) =>
    activeClient().put<AdminUser>(`/admin/users/${userId}`, data),

  addPoints: (userId: number, payload: ManualPointsPayload) =>
    activeClient().post(`/admin/users/${userId}/points`, payload),

  addPointsForm: (userId: number, formData: FormData) =>
    activeClient().post(`/admin/users/${userId}/points`, formData),

  removeMember: (roomId: number, userId: number) =>
    activeClient().delete(`/rooms/${roomId}/members/${userId}`),

  // Room settings
  updateRoom: (roomId: number, payload: { name?: string; description?: string }) =>
    activeClient().patch<Room>(`/rooms/${roomId}`, payload),

  uploadRoomPhoto: (roomId: number, formData: FormData) =>
    activeClient().post<Room>(`/rooms/${roomId}/photo`, formData),

  deleteRoomPhoto: (roomId: number) =>
    activeClient().delete(`/rooms/${roomId}/photo`),

  addRoomAdmin: (roomId: number, email: string) =>
    activeClient().post(`/rooms/${roomId}/admins`, { email }),

  deleteRoom: (roomId: number) =>
    activeClient().delete(`/rooms/${roomId}`),

  // Reports
  getPendingReports: (page = 1) =>
    activeClient().get<PaginatedResponse<Violation>>('/admin/reports/pending', { params: { page } }),

  getReportHistory: (page = 1) =>
    activeClient().get<PaginatedResponse<Violation>>('/admin/reports/history', { params: { page } }),

  getReportSummary: (params?: { period?: 'monthly' | 'yearly'; month?: number; year?: number }) =>
    activeClient().get('/admin/report-summary', { params }),

  updateViolationStatus: (id: number, payload: UpdateViolationStatusPayload) =>
    activeClient().patch<Violation>(`/admin/violations/${id}/status`, payload),

  // Rules
  createRule: (payload: CreateRulePayload) =>
    activeClient().post<Rule>('/admin/rules', payload),

  getDeletedRules: () =>
    activeClient().get<Rule[]>('/admin/rules/deleted'),

  restoreRule: (id: number) =>
    activeClient().patch(`/admin/rules/${id}/restore`),

  updateRule: (id: number, payload: Partial<CreateRulePayload>) =>
    activeClient().put<Rule>(`/admin/rules/${id}`, payload),

  deleteRule: (id: number) =>
    activeClient().delete(`/admin/rules/${id}`),

  // Departments
  getDepartments: () =>
    activeClient().get<Department[]>('/admin/departments'),

  createDepartment: (name: string) =>
    activeClient().post<Department>('/admin/departments', { name }),

  deleteDepartment: (id: number) =>
    activeClient().delete(`/admin/departments/${id}`),

  // Export - Returns full URL for file download
  getExportUrl: (type: 'excel' | 'pdf', params?: { month?: number; year?: number }): string => {
    const { activeBackend } = useMultiAuthStore.getState();
    if (!activeBackend) {
      throw new Error('Belum login ke backend aktif.');
    }
    
    const config = getBackendConfig(activeBackend);
    const baseURL = config.baseURL;
    const endpoint = type === 'excel' ? '/admin/export/excel' : '/admin/export/pdf';
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', String(params.month));
    if (params?.year) queryParams.append('year', String(params.year));
    
    const queryString = queryParams.toString();
    return `${baseURL}${endpoint}${queryString ? `?${queryString}` : ''}`;
  },

  // Get auth token for download requests
  getAuthToken: async (): Promise<string | null> => {
    const { activeBackend } = useMultiAuthStore.getState();
    if (!activeBackend) return null;
    
    const tokenKey = `${activeBackend}_token`;
    return await SecureStorage.getItem(tokenKey);
  },

  // Get headers needed for authenticated file downloads (bypasses axios interceptor)
  getDownloadHeaders: async (): Promise<Record<string, string>> => {
    const { activeBackend } = useMultiAuthStore.getState();
    if (!activeBackend) return {};

    const tokenKey = `${activeBackend}_token`;
    const token = await SecureStorage.getItem(tokenKey);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Include active room ID — required by the backend for room-scoped endpoints
    const { useRoomStore } = require('../stores/roomStore');
    const activeRoomId: number | undefined = useRoomStore.getState().activeRoom?.id;
    if (activeRoomId) {
      headers['X-Room-Id'] = String(activeRoomId);
    }

    return headers;
  },
};
