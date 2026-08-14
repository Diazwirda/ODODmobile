/**
 * API Clients Registry
 * 
 * Exports configured clients for each backend
 */

import { AxiosInstance } from 'axios';
import { createApiClient, setHydrating as setBaseClientHydrating } from './baseClient';
import type { BackendType } from '../../config/backends';

// Store client instances
const clients: Partial<Record<BackendType, AxiosInstance>> = {};

// Callback handlers (set from App.tsx)
let onUnauthorizedCallback: ((backend: BackendType) => void) | null = null;
let getActiveRoomIdCallback: (() => Promise<number | null>) | null = null;

/**
 * Set hydration mode
 * When true, 401 errors won't trigger onUnauthorized callbacks
 */
export const setHydrating = setBaseClientHydrating;

/**
 * Set global callbacks
 */
export const setClientCallbacks = (callbacks: {
  onUnauthorized: (backend: BackendType) => void;
  getActiveRoomId: () => Promise<number | null>;
}) => {
  onUnauthorizedCallback = callbacks.onUnauthorized;
  getActiveRoomIdCallback = callbacks.getActiveRoomId;
};

/**
 * Get or create API client for specific backend
 */
export const getClient = (backend: BackendType): AxiosInstance => {
  // Return existing client if already created
  if (clients[backend]) {
    return clients[backend]!;
  }

  // Create new client
  // NOTE: onUnauthorized/getActiveRoomId are wrapped so they always read the
  // *current* callback variable at request time. The client instance is cached
  // forever below, so if we captured the callback value directly here, later
  // calls to setClientCallbacks() (e.g. when the user switches active room)
  // would never reach this already-created client — it would keep sending the
  // X-Room-Id of whichever room was active the first time this backend's
  // client was created.
  const client = createApiClient({
    backend,
    onUnauthorized: () => onUnauthorizedCallback?.(backend),
    getActiveRoomId: () => getActiveRoomIdCallback?.() ?? Promise.resolve(null),
  });

  // Cache it
  clients[backend] = client;

  return client;
};

/**
 * Shorthand getters for each backend
 */
export const odobClient = () => getClient('odob');
export const spotClient = () => getClient('spot');

/**
 * Reset clients (useful for testing or logout)
 */
export const resetClients = () => {
  Object.keys(clients).forEach((key) => {
    delete clients[key as BackendType];
  });
};
