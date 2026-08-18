/**
 * Base API Client Factory
 * 
 * Creates configured Axios instances for each backend
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { BackendType } from '../../config/backends';
import { getBackendConfig } from '../../config/backends';
import * as SecureStorage from '../../services/secureStorage';

interface ClientOptions {
  backend: BackendType;
  onUnauthorized?: () => void;
  getActiveRoomId?: () => Promise<number | null>;
}

// Track if we're in hydration mode (suppress UI warnings)
let isHydrating = false;

/**
 * Set hydration mode
 * When true, 401 errors won't trigger onUnauthorized callbacks
 * Use during app startup to silently validate stored tokens
 */
export const setHydrating = (hydrating: boolean) => {
  isHydrating = hydrating;
};

export const createApiClient = (options: ClientOptions): AxiosInstance => {
  const config = getBackendConfig(options.backend);
  
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: 30000,
    headers: {
      Accept: 'application/json',
    },
  });

  // Request interceptor - add token and room ID
  client.interceptors.request.use(
    async (requestConfig) => {
      // Get token for this specific backend
      const tokenKey = `${options.backend}_token`;
      const token = await SecureStorage.getItem(tokenKey);
      
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      // Get active room ID if function provided
      // Skip if request explicitly sets skipRoomId flag
      const skipRoomId = (requestConfig as any).skipRoomId;
      if (options.getActiveRoomId && !skipRoomId) {
        const roomId = await options.getActiveRoomId();
        if (roomId) {
          requestConfig.headers['X-Room-Id'] = String(roomId);
          if (__DEV__) {
            console.log(`[API] ${requestConfig.method?.toUpperCase()} ${requestConfig.url} → X-Room-Id: ${roomId}`);
          }
        }
      } else if (skipRoomId && __DEV__) {
        console.log(`[API] ${requestConfig.method?.toUpperCase()} ${requestConfig.url} → Skip X-Room-Id (global operation)`);
      }

      // Set content type based on data
      if (requestConfig.data instanceof FormData) {
        requestConfig.headers['Content-Type'] = 'multipart/form-data';
      } else if (!requestConfig.headers['Content-Type']) {
        requestConfig.headers['Content-Type'] = 'application/json';
      }

      return requestConfig;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor - handle errors and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // When a request used responseType: 'blob' (file downloads/exports),
      // axios decodes an ERROR response's body as a Blob too, regardless of
      // status code — so error.response.data ends up as an opaque Blob
      // instead of the parsed JSON error, and handleApiError() can never
      // read the real message. Decode it back to JSON here so error
      // handling works the same for blob and non-blob requests.
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          error.response.data = JSON.parse(text);
        } catch {
          // Not JSON (e.g. an HTML error page) — leave as-is.
        }
      }

      const status = error.response?.status;
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 - Token expired/invalid
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          const tokenKey = `${options.backend}_token`;
          const oldToken = await SecureStorage.getItem(tokenKey);

          const { data } = await axios.post(
            `${config.baseURL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${oldToken}`,
                Accept: 'application/json',
              },
            },
          );

          // Save new token
          await SecureStorage.setItem(tokenKey, data.token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear token and notify
          const tokenKey = `${options.backend}_token`;
          await SecureStorage.removeItem(tokenKey);
          
          // Only trigger onUnauthorized if not in hydration mode
          // During hydration, we silently clear invalid tokens
          if (options.onUnauthorized && !isHydrating) {
            options.onUnauthorized();
          }
          
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};
