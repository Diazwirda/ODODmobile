import type { Rule } from './rule';
import type { ImageFile } from './common';

export type ViolationStatus = 'pending' | 'verified' | 'rejected';

export interface ViolationUser {
  id: number;
  name: string;
  department?: string;
  photo?: string;
}

export interface Violation {
  id: number;
  rule: Rule;
  reporter: ViolationUser;
  violator: ViolationUser;
  violators: ViolationUser[];
  status: ViolationStatus;
  description?: string;
  photos: string[];
  reject_reason?: string;
  created_at: string;
}

export interface CreateViolationPayload {
  rule_id: number;
  violator_ids: number[];
  description?: string;
  photos: ImageFile[];
}

export interface UpdateViolationStatusPayload {
  status: 'verified' | 'rejected';
  reject_reason?: string;
}
