export type ViolationStatus = 'pending' | 'verified' | 'rejected';

export interface ViolationUser {
  id: number;
  name: string;
  photo?: string;
}

export interface Violation {
  id: number;
  rule: { id: number; name: string };
  reporter: ViolationUser;
  violators: ViolationUser[];
  status: ViolationStatus;
  description?: string;
  photos: string[];
  reject_reason?: string;
  points_awarded?: number;
  created_at: string;
}

export interface CreateViolationPayload {
  rule_id: number;
  violator_ids: number[];
  description?: string;
  photos: { uri: string; type: string; name: string }[];
}

export interface UpdateViolationStatusPayload {
  status: 'verified' | 'rejected';
  reject_reason?: string;
}
