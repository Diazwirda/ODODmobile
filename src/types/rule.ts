export interface Rule {
  id: number;
  name: string;
  description?: string;
  category?: string;
  admin_only: boolean;
  created_at: string;
}

export interface ArchivedRule {
  id: number;
  name: string;
  days_left: number;
  purge_at: string;
}

export interface CreateRulePayload {
  name: string;
  description?: string;
  category?: string;
  admin_only: boolean;
}
