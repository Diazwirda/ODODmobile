/**
 * authStore — full implementation (task 8.1).
 *
 * Manages authentication state and all auth-related API calls.
 * Token persistence is handled via react-native-keychain through
 * the secureStorage service.
 */

import { create } from 'zustand';
import apiClient from '@api/client';
import { saveToken, getToken, removeToken } from '@services/secureStorage';
import type { AuthUser, AuthResponse, RegisterPayload } from '@/types/auth';

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setToken: (token: string) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * Authenticates the user with email and password.
   * On success, persists the token to Keychain and updates state.
   * On failure, resets isLoading and rethrows so the calling UI can handle it.
   */
  login: async (email: string, password: string): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      await saveToken(data.token);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Registers a new user account.
   * On success, persists the token to Keychain and updates state.
   * On failure, resets isLoading and rethrows.
   */
  register: async (data: RegisterPayload): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data: responseData } = await apiClient.post<AuthResponse>(
        '/auth/register',
        data,
      );
      await saveToken(responseData.token);
      set({
        token: responseData.token,
        user: responseData.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Completes Google OAuth login.
   * The token is the JWT returned via the deep-link callback URL fragment.
   * No extra fetch is needed — the token is valid immediately.
   * User profile can be populated later via a separate GET /auth/me call if needed.
   */
  loginWithGoogle: async (token: string): Promise<void> => {
    await saveToken(token);
    set({
      token,
      user: null,
      isAuthenticated: true,
    });
  },

  /**
   * Logs the user out.
   * Attempts to invalidate the token server-side; errors are swallowed so that
   * the local session is always cleared even if the server is unreachable.
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.delete('/auth/logout');
    } catch {
      // Intentionally swallowed — local cleanup proceeds regardless
    }
    await removeToken();
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Requests a new JWT from the server using the current session.
   * Updates both Keychain and in-memory state with the new token.
   */
  refreshToken: async (): Promise<void> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh');
    await saveToken(data.token);
    set({ token: data.token });
  },

  /**
   * Resets auth state immediately without making any API call.
   * Called by the Axios response interceptor when token refresh fails.
   */
  clearAuth: (): void => {
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Sets the in-memory token without touching Keychain.
   * Useful for injecting a token received outside the normal auth flow.
   */
  setToken: (token: string): void => {
    set({ token });
  },

  /**
   * Reads the stored token from Keychain on app start.
   * If a token exists, marks the session as authenticated so the navigator
   * can send the user straight to the app stack.
   * If no token is found, explicitly clears any stale in-memory state.
   */
  hydrate: async (): Promise<void> => {
    const token = await getToken();
    if (token) {
      set({ token, isAuthenticated: true });
    } else {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
