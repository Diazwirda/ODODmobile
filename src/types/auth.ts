export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'reporter' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  department?: string;
  position?: string;
}
