export interface AdminUser {
  id: number;
  name: string;
  email: string;
  photo?: string;
  department?: string;
  position?: string;
  points: number;
  membership_role: string;
}

export interface ManualPointsPayload {
  points: number;
  reason: string;
  evidence?: unknown;
}

export interface Department {
  id: number;
  name: string;
  member_count?: number;
}
