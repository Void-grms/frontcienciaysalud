export type UserRole = 'admin' | 'reference_user' | 'patient';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string | null;
  documentNumber?: string | null;
  fullName: string | null;
  mustChangePassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}
