/**
 * Unified Room Service
 * 
 * Aggregates rooms from both backends and provides unified interface
 */

import { spotClient } from '../api/clients';
import type { Room } from '../types/room';
import type { BackendType } from '../config/backends';

const normalizeRoomRole = (room: Partial<Room>): 'admin' | 'reporter' => {
  const rawRole = room.membership_role ?? room.user_role ?? room.role;
  return rawRole === 'admin' ? 'admin' : 'reporter';
};

const normalizeRoom = (room: Room, backend: BackendType): Room => {
  const membershipRole = normalizeRoomRole(room);
  return {
    ...room,
    photo: room.photo ?? room.logo,
    membership_role: membershipRole,
    can_manage: Boolean(room.can_manage ?? membershipRole === 'admin'),
    backend,
  };
};

export class UnifiedRoomService {
  /**
   * Get all rooms from all backends
   * Returns merged array with backend identifier
   */
  static async getAllRooms(): Promise<Room[]> {
    return this.getRoomsFromBackend('spot');
  }

  /**
   * Get rooms from specific backend
   * NOTE: Getting rooms is a global operation and should not include X-Room-Id header
   */
  private static async getRoomsFromBackend(
    backend: BackendType,
  ): Promise<Room[]> {
    const client = spotClient();

    try {
      // Get all rooms without X-Room-Id header (it's a global operation)
      const { data } = await client.get<Room[]>('/rooms', {
        skipRoomId: true, // Flag to skip X-Room-Id header
      } as any);
      
      if (__DEV__) {
        console.log(`[UnifiedRoomService] Fetched ${data.length} rooms from ${backend}:`, 
          data.map(r => ({ id: r.id, name: r.name }))
        );
      }
      
      // Tag each room with its backend
      return data.map((room) => normalizeRoom(room, backend));
    } catch (error: any) {
      // 401 = Not authenticated on this backend (expected, not an error)
      if (error?.response?.status === 401) {
        if (__DEV__) {
          console.log(`[UnifiedRoomService] Not authenticated on ${backend}, skipping`);
        }
        return []; // Return empty array, not an error
      }
      
      // Other errors are real problems
      console.error(`Failed to fetch rooms from ${backend}:`, error);
      throw error;
    }
  }

  /**
   * Create room in specific backend
   * NOTE: Room creation is a global operation and should not include X-Room-Id header
   */
  static async createRoom(
    backend: BackendType,
    payload: { name: string; description?: string },
  ): Promise<Room> {
    const client = spotClient();

    try {
      // Create room with auto-generated invite code (8 character uppercase random)
      // Valid invite_code_type values: 'generated' or 'manual'
      // Using 'generated' for automatic code generation
      const response = await client.post<Room>('/rooms', {
        ...payload,
        invite_code_type: 'generated',
        invite_code_enabled: true, // Enable invite code by default
      }, {
        skipRoomId: true,
      } as any);
      
      if (__DEV__) {
        console.log('[UnifiedRoomService] POST /rooms response:', {
          status: response.status,
          data: response.data,
        });
      }
      
      const { data } = response;
      
      if (!data) {
        throw new Error('Backend did not return room data');
      }
      
      if (__DEV__) {
        console.log('[UnifiedRoomService] Room created:', {
          id: data.id,
          name: data.name,
          code: data.code || data.invite_code,
          membership_role: data.membership_role,
          user_role: data.user_role,
        });
      }
      
      return normalizeRoom(data, backend);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[UnifiedRoomService] Create room failed:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          errors: error.response?.data?.errors,
          fullError: error.response?.data,
        });
      }
      throw error;
    }
  }

  /**
   * Join room in specific backend
   * NOTE: Joining room is a global operation and should not include X-Room-Id header
   */
  static async joinRoom(
    backend: BackendType,
    code: string,
  ): Promise<{ room: Room; message: string }> {
    const client = spotClient();

    // Join room without X-Room-Id header (it's a global operation)
    const { data } = await client.post<{ message: string; room: Room }>(
      '/rooms/join',
      { code },
      { skipRoomId: true } as any, // Flag to skip X-Room-Id header
    );

    return {
      ...data,
      room: normalizeRoom(data.room, backend),
    };
  }
}
