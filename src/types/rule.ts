export interface Rule {
  id: number;
  name: string;
  description?: string;
  category?: string;
  reporter_points?: number;
  violator_points?: number;
  admin_only: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface CreateRulePayload {
  name: string;
  description?: string;
  category?: string;
  reporter_points?: number;
  violator_points?: number;
  admin_only?: boolean;
}
