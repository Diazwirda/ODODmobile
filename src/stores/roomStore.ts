import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnifiedRoomService } from '../services/unifiedRoomService';
import { useMultiAuthStore } from './multiAuthStore';
import type {
  Room,
  CreateRoomPayload,
  JoinRoomPayload,
  MembershipRole,
} from '../types/room';

interface RoomStore {
  rooms: Room[];
  activeRoom: Room | null;
  activeRoomRole: MembershipRole | null;
  isLoading: boolean;

  fetchRooms: () => Promise<void>;
  setActiveRoom: (room: Room) => void;
  clearActiveRoom: () => void;
  createRoom: (payload: CreateRoomPayload) => Promise<void>;
  joinRoom: (payload: JoinRoomPayload) => Promise<Room>;
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set, get) => ({
      rooms: [],
      activeRoom: null,
      activeRoomRole: null,
      isLoading: false,

      /**
       * Fetch rooms from all authenticated backends
       * Uses UnifiedRoomService to aggregate rooms
       */
      fetchRooms: async () => {
        set({ isLoading: true });
        try {
          const rooms = await UnifiedRoomService.getAllRooms();
          
          if (__DEV__) {
            console.log(`[Room Store] Fetched ${rooms.length} rooms total`);
            if (rooms.length > 0) {
              console.log('[Room Store] Sample room:', {
                id: rooms[0].id,
                name: rooms[0].name,
                backend: rooms[0].backend,
              });
            }
          }
          
          // Keep activeRoom in sync — e.g. after an admin edits the room's
          // name/description/photo, the previously-selected activeRoom would
          // otherwise stay stale until the user re-picks it from the list.
          const currentActiveRoom = get().activeRoom;
          const refreshedActiveRoom = currentActiveRoom
            ? rooms.find((room) => room.id === currentActiveRoom.id)
            : undefined;

          set({
            rooms,
            isLoading: false,
            ...(refreshedActiveRoom ? { activeRoom: refreshedActiveRoom } : {}),
          });
        } catch (error) {
          if (__DEV__) {
            console.error('[Room Store] Failed to fetch rooms:', error);
          }
          set({ isLoading: false });
          throw error;
        }
      },

      /**
       * Set active room and store its backend context
       */
      setActiveRoom: (room) => {
        const membershipRole: MembershipRole = room.membership_role === 'admin' || room.user_role === 'admin' || room.role === 'admin'
          ? 'admin'
          : 'reporter';
        const normalizedRoom = {
          ...room,
          membership_role: membershipRole,
          can_manage: Boolean(room.can_manage ?? membershipRole === 'admin'),
        };
        if (__DEV__) {
          console.log(`[Room Store] Setting active room: ${normalizedRoom.name} (${normalizedRoom.backend}) as ${membershipRole}`);
        }
        set({ activeRoom: normalizedRoom, activeRoomRole: membershipRole });
      },

      /**
       * Clear active room
       */
      clearActiveRoom: () => {
        if (__DEV__) {
          console.log('[Room Store] Clearing active room');
        }
        set({ activeRoom: null, activeRoomRole: null });
      },

      /**
       * Create room in active backend
       */
      createRoom: async (payload) => {
        const { activeBackend } = useMultiAuthStore.getState();
        
        if (!activeBackend) {
          throw new Error('No active backend. Please login first.');
        }

        if (__DEV__) {
          console.log(`[Room Store] Creating room in ${activeBackend}:`, payload.name);
        }

        const room = await UnifiedRoomService.createRoom(activeBackend, payload);
        
        set((state) => ({ 
          rooms: [...state.rooms, room],
        }));

        if (__DEV__) {
          console.log(`[Room Store] Room created successfully:`, room.id);
        }
      },

      /**
       * Join room in active backend
       */
      joinRoom: async (payload) => {
        const { activeBackend } = useMultiAuthStore.getState();
        
        if (!activeBackend) {
          throw new Error('No active backend. Please login first.');
        }

        if (__DEV__) {
          console.log(`[Room Store] Joining room in ${activeBackend}:`, payload.code);
        }

        const { room } = await UnifiedRoomService.joinRoom(activeBackend, payload.code);

        // Add or update room in list
        set((state) => ({
          rooms: [...state.rooms.filter(r => r.id !== room.id), room],
        }));

        if (__DEV__) {
          console.log(`[Room Store] Room joined successfully:`, room.id);
        }

        return room;
      },
    }),
    {
      name: 'odob-room-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist activeRoom and activeRoomRole — rooms will be fetched on startup
      partialize: (state) => ({
        activeRoom: state.activeRoom,
        activeRoomRole: state.activeRoomRole,
      }),
    },
  ),
);
