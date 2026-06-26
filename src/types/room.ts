import type { ImageFile } from './common';

export type MembershipRole = 'admin' | 'reporter';
export type InviteCodeType = 'generated' | 'manual';

export interface RoomAdmin {
  id: number;
  name: string;
  email: string;
  department?: string;
  photo?: string;
}

export interface Room {
  id: number;
  name: string;
  slug: string;
  description?: string;
  photo?: string;
  invite_code: string;
  invite_code_enabled: boolean;
  invite_code_type: InviteCodeType;
  membership_role: MembershipRole;
  can_manage: boolean;
  admins: RoomAdmin[];
  joined_at: string;
  created_at: string;
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  photo?: ImageFile;
  invite_code_type: InviteCodeType;
  invite_code?: string;
}

export interface UpdateRoomPayload {
  name?: string;
  description?: string;
  photo?: ImageFile;
  invite_code_enabled?: boolean;
  invite_code_type?: InviteCodeType;
  invite_code?: string;
}
