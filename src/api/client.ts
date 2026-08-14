/**
 * LEGACY API CLIENT
 * 
 * ⚠️ This is the OLD single-backend API client.
 * It's still used by some old files (roomStore, authStore, RoomTabs).
 * 
 * For NEW code, use:
 * - import { getClient, odobClient, spotClient } from '../api/clients';
 * 
 * TODO: Migrate all old files to use new dual-backend clients
 * - [ ] roomStore.ts → use UnifiedRoomService
 * - [ ] authStore.ts → deprecated, use multiAuthStore
 * - [ ] RoomTabs.tsx → use new client
 * - [ ] RoomTabsFixed.tsx → use new client
 */

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Config from 'react-native-config';
import * as SecureStorage from '../services/secureStorage';
import { navigationRef } from '../navigation/navigationRef';

// Fallback jika react-native-config belum terbaca (perlu native rebuild setelah ubah .env)
const BASE_URL = Config.API_BASE_URL ?? 'https://spot.slimrich.id/api';

if (__DEV__) {
  console.log('[API] Base URL:', BASE_URL);
}
// Fungsi ini diset dari luar untuk menghindari circular import
let _onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (fn: () => void) => {
  _onUnauthorized = fn;
};

// Active room id — diset dari roomStore
let _activeRoomId: number | null = null;
export const setActiveRoomId = (id: number | null) => {
  _activeRoomId = id;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { Accept: 'application/json' },
});

// Request interceptor — inject token + X-Room-Id
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (_activeRoomId) {
    config.headers['X-Room-Id'] = String(_activeRoomId);
  }
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Response interceptor — error handling + token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${await SecureStorage.getToken()}`,
              Accept: 'application/json',
            },
          },
        );
        await SecureStorage.saveToken(data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return apiClient(originalRequest);
      } catch {
        await SecureStorage.removeToken();
        _onUnauthorized?.();
        // Don't reset navigation here - let RootNavigator handle it via multiAuthStore
        // The new dual-backend architecture handles navigation automatically
        if (__DEV__) {
          console.log('[OLD API CLIENT] Token refresh failed, auth state will be handled by multiAuthStore');
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
