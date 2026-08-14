import apiClient from './client';
import type { AuthResponse, LoginPayload, RegisterPayload, AuthUser } from '../types/auth';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<AuthUser>('/auth/me'),

  refresh: () => apiClient.post<{ token: string }>('/auth/refresh'),
};
