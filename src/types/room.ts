import type { BackendType } from '../config/backends';

export type MembershipRole = 'admin' | 'reporter';

export interface Room {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  photo?: string;
  logo?: string;
  code?: string;
  invite_code?: string;
  room_code?: string;
  user_role?: 'admin' | 'member' | 'reporter' | string;
  role?: 'admin' | 'member' | 'reporter' | string;
  membership_role: MembershipRole;
  can_manage: boolean;
  backend: BackendType; // NEW: identifies which backend this room is from
  created_at: string;
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
}

export interface JoinRoomPayload {
  code: string;
}
