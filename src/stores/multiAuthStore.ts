/**
 * Multi-Backend Auth Store
 * 
 * Manages authentication state for multiple backends
 */

import { create } from 'zustand';
import { spotClient, setHydrating } from '../api/clients';
import * as SecureStorage from '../services/secureStorage';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth';
import type { BackendType } from '../config/backends';
import { validateEmailForBackend } from '../config/backends';

interface BackendAuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface MultiAuthStore {
  // Auth state per backend
  odob: BackendAuthState;
  spot: BackendAuthState;

  // Currently active backend
  activeBackend: BackendType | null;

  // Loading state
  isLoading: boolean;

  // Actions
  loginToBackend: (
    backend: BackendType,
    payload: LoginPayload,
  ) => Promise<void>;
  registerToBackend: (
    backend: BackendType,
    payload: RegisterPayload,
  ) => Promise<void>;
  logoutFromBackend: (backend: BackendType, skipApiCall?: boolean) => Promise<void>;
  logoutFromAll: () => Promise<void>;
  hydrateBackend: (backend: BackendType) => Promise<void>;
  hydrateAll: () => Promise<void>;
  setActiveBackend: (backend: BackendType) => Promise<void>;
  
  // Utilities
  isAuthenticatedOnAny: () => boolean;
  isAuthenticatedOn: (backend: BackendType) => boolean;
}

const initialBackendState: BackendAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

export const useMultiAuthStore = create<MultiAuthStore>()((set, get) => ({
  odob: { ...initialBackendState },
  spot: { ...initialBackendState },
  activeBackend: null,
  isLoading: false,

  /**
   * Login to specific backend
   */
  loginToBackend: async (backend, payload) => {
    // Validate email for backend
    if (!validateEmailForBackend(payload.email, backend)) {
      throw new Error(
        backend === 'spot'
          ? 'Spot Slimrich requires @humanplus.co.id email'
          : 'Invalid email format',
      );
    }

    set({ isLoading: true });

    try {
      const client = spotClient();
      const { data } = await client.post<{
        token: string;
        user: AuthUser;
      }>('/auth/login', payload);

      // Save token to secure storage
      await SecureStorage.setItem(`${backend}_token`, data.token);
      
      // Remember this backend for next launch
      await SecureStorage.setItem('last_backend', backend);

      // Update state
      set({
        [backend]: {
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        },
        activeBackend: backend, // Set as active immediately
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Register to specific backend
   */
  registerToBackend: async (backend, payload) => {
    // Validate email for backend
    if (!validateEmailForBackend(payload.email, backend)) {
      throw new Error(
        backend === 'spot'
          ? 'Spot Slimrich requires @humanplus.co.id email'
          : 'Invalid email format',
      );
    }

    set({ isLoading: true });

    try {
      const client = spotClient();
      const { data } = await client.post<{
        token: string;
        user: AuthUser;
      }>('/auth/register', payload);

      // Save token
      await SecureStorage.setItem(`${backend}_token`, data.token);
      
      // Remember this backend for next launch
      await SecureStorage.setItem('last_backend', backend);

      // Update state
      set({
        [backend]: {
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        },
        activeBackend: backend, // Set as active immediately
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Logout from specific backend
   */
  logoutFromBackend: async (backend, skipApiCall = false) => {
    // Only call API logout if not skipping (e.g., when called from onUnauthorized)
    if (!skipApiCall) {
      try {
        const client = spotClient();
        await client.post('/auth/logout');
      } catch (error: any) {
        // 401 is expected when token already invalid - don't warn
        if (error?.response?.status !== 401) {
          console.warn(`Logout from ${backend} failed:`, error);
        }
      }
    }

    // Remove token
    await SecureStorage.removeItem(`${backend}_token`);

    // Reset state
    set((state) => ({
      [backend]: { ...initialBackendState },
      activeBackend:
        state.activeBackend === backend
          ? null
          : state.activeBackend,
    }));
  },

  /**
   * Logout from all backends
   */
  logoutFromAll: async () => {
    await get().logoutFromBackend('spot');

    set({
      odob: { ...initialBackendState },
      spot: { ...initialBackendState },
      activeBackend: null,
    });
  },

  /**
   * Hydrate auth state from storage for specific backend
   * Silently validates stored tokens without triggering UI warnings
   */
  hydrateBackend: async (backend) => {
    const token = await SecureStorage.getItem(`${backend}_token`);

    // No token = user never logged in to this backend
    // This is normal, not an error
    if (!token) {
      set((state) => ({
        [backend]: { ...initialBackendState },
      }));
      return;
    }

    // Token exists, try to validate it
    try {
      const client = spotClient();
      const { data } = await client.get<AuthUser>('/auth/me');

      // Token is valid
      set((state) => ({
        [backend]: {
          user: data,
          token,
          isAuthenticated: true,
        },
        activeBackend: state.activeBackend || backend,
      }));
    } catch (error) {
      // Token is invalid/expired
      // Silently clear it without triggering onUnauthorized callback
      // (we don't want to show "logging out" warning during app startup)
      await SecureStorage.removeItem(`${backend}_token`);
      set((state) => ({
        [backend]: { ...initialBackendState },
      }));
      
      // Only log in development for debugging
      if (__DEV__) {
        console.log(`[Hydration] ${backend} token invalid, cleared silently`);
      }
    }
  },

  /**
   * Hydrate all backends
   * Silently validates tokens during app startup
   */
  hydrateAll: async () => {
    // Enable hydration mode to suppress UI warnings
    setHydrating(true);
    
    try {
      await get().hydrateBackend('spot');
      
      // Spot Slimrich is the only active backend.
      const state = get();
      if (state.spot.isAuthenticated) {
        set({ activeBackend: 'spot' });
      }
    } finally {
      // Disable hydration mode after startup
      setHydrating(false);
    }
  },

  /**
   * Set active backend
   */
  setActiveBackend: async (backend) => {
    set({ activeBackend: backend });
    // Remember for next launch
    await SecureStorage.setItem('last_backend', backend);
  },

  /**
   * Check if authenticated on any backend
   */
  isAuthenticatedOnAny: () => {
    const state = get();
    return state.spot.isAuthenticated;
  },

  /**
   * Check if authenticated on specific backend
   */
  isAuthenticatedOn: (backend) => {
    const state = get();
    return state[backend].isAuthenticated;
  },
}));
