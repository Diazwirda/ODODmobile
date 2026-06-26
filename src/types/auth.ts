export interface AuthUser {
  id: number;
  name: string;
  email: string;
  department?: string;
  position?: string;
  photo?: string;
  tutorial_flags: {
    company_tutorial_completed: boolean;
    user_tutorial_completed: boolean;
    admin_tutorial_completed: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  department?: string;
  position?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
