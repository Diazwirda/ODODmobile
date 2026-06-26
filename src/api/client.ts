import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as Keychain from 'react-native-keychain';
import Config from 'react-native-config';
import { saveToken, removeToken } from '@services/secureStorage';
import { useAuthStore } from '@stores/authStore';
import { navigationRef } from '@navigation/navigationRef';
import { normalizeError } from './errorNormalizer';

const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor — inject JWT and set Content-Type
apiClient.interceptors.request.use(async (config) => {
  const token = await Keychain.getGenericPassword();
  if (token) {
    config.headers.Authorization = `Bearer ${token.password}`;
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Response interceptor — 401 handler with token refresh & error normalizer
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await apiClient.post<{ token: string }>('/auth/refresh');
        await saveToken(data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return apiClient(originalRequest);
      } catch {
        await removeToken();
        useAuthStore.getState().clearAuth();
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        });
        return Promise.reject(normalizeError(error));
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

export default apiClient;
