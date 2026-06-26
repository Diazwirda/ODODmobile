import { create } from 'zustand';
import apiClient from '@api/client';
import type {
  Room,
  MembershipRole,
  CreateRoomPayload,
  UpdateRoomPayload,
} from '@/types/room';

interface RoomStore {
  rooms: Room[];
  activeRoom: Room | null;
  activeRoomRole: MembershipRole | null;
  isLoading: boolean;

  fetchRooms: () => Promise<void>;
  setActiveRoom: (room: Room) => void;
  createRoom: (data: CreateRoomPayload) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room>;
  updateRoom: (id: number, data: UpdateRoomPayload) => Promise<void>;
  deleteRoom: (id: number) => Promise<void>;
  clearActiveRoom: () => void;
}

export const useRoomStore = create<RoomStore>()((set, get) => ({
  rooms: [],
  activeRoom: null,
  activeRoomRole: null,
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get<Room[]>('/rooms');
      set({ rooms: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setActiveRoom: (room: Room) => {
    set({ activeRoom: room, activeRoomRole: room.membership_role });
  },

  createRoom: async (data: CreateRoomPayload) => {
    let body: FormData | CreateRoomPayload;

    if (data.photo) {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('photo', {
        uri: data.photo.uri,
        type: data.photo.type,
        name: data.photo.name,
      } as unknown as Blob);
      formData.append('invite_code_type', data.invite_code_type);
      if (data.invite_code) formData.append('invite_code', data.invite_code);
      body = formData;
    } else {
      body = data;
    }

    const { data: newRoom } = await apiClient.post<Room>('/rooms', body);
    set((state) => ({ rooms: [...state.rooms, newRoom] }));
    return newRoom;
  },

  joinRoom: async (code: string) => {
    const { data: room } = await apiClient.post<Room>('/rooms/join', {
      invite_code: code,
    });
    set((state) => ({ rooms: [...state.rooms, room] }));
    return room;
  },

  updateRoom: async (id: number, data: UpdateRoomPayload) => {
    let body: FormData | UpdateRoomPayload;

    if (data.photo) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('photo', {
        uri: data.photo.uri,
        type: data.photo.type,
        name: data.photo.name,
      } as unknown as Blob);
      if (data.invite_code_enabled !== undefined) {
        formData.append('invite_code_enabled', String(data.invite_code_enabled));
      }
      if (data.invite_code_type) formData.append('invite_code_type', data.invite_code_type);
      if (data.invite_code) formData.append('invite_code', data.invite_code);
      body = formData;
    } else {
      body = data;
    }

    const { data: updatedRoom } = await apiClient.put<Room>(`/rooms/${id}`, body);

    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? updatedRoom : r)),
      activeRoom:
        state.activeRoom?.id === id ? updatedRoom : state.activeRoom,
    }));
  },

  deleteRoom: async (id: number) => {
    await apiClient.delete(`/rooms/${id}`);
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
    }));
    get().clearActiveRoom();
  },

  clearActiveRoom: () => {
    set({ activeRoom: null, activeRoomRole: null });
  },
}));
