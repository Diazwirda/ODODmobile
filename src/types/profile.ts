export interface UserProfile {
  id: number;
  name: string;
  email: string;
  photo?: string;
  department?: string;
  position?: string;
  age?: number;
  points: number;
  rank: number;
  membership_role: string;
}

export interface UpdateProfilePayload {
  name: string;
  age?: number;
  department?: string;
  position?: string;
}
