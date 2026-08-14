import { create } from 'zustand';
import apiClient from '../api/client';
import * as SecureStorage from '../services/secureStorage';
import type {
  AuthUser,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post<AuthResponse>(
        '/auth/login',
        payload,
      );
      await SecureStorage.saveToken(data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post<AuthResponse>(
        '/auth/register',
        payload,
      );
      await SecureStorage.saveToken(data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    await SecureStorage.removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: async () => {
    const token = await SecureStorage.getToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }
    try {
      const { data } = await apiClient.get<AuthUser>('/auth/me');
      set({ token, user: data, isAuthenticated: true });
    } catch {
      await SecureStorage.removeToken();
      set({ isAuthenticated: false });
    }
  },

  clearAuth: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
