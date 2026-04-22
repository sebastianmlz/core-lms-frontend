export type UserRole = 'STUDENT' | 'TUTOR';

export interface LoginCredentials {
  username: string;
  password: string;
  preferredRole: UserRole;
}

export interface TokenPairResponse {
  access: string;
  refresh: string;
  role?: UserRole;
  user_id?: number;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

export interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  activeRole: UserRole | null;
  username: string | null;
  isLoading: boolean;
  error: string | null;
}
