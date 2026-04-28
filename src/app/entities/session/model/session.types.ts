export type UserRole = 'STUDENT' | 'TUTOR';

export interface LoginCredentials {
  username: string;
  password: string;
  preferredRole: UserRole;
}

export interface TokenUserPayload {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  vark_dominant: string | null;
  full_name: string;
}

export interface TokenPairResponse {
  access: string;
  refresh: string;
  user?: TokenUserPayload;
  // Top-level fallbacks kept for backwards compatibility with older tests/mocks.
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
  userId: number | null;
  dominantVark: string | null; // AxiomVarkProfile en backend mappings
  isLoading: boolean;
  error: string | null;
}
