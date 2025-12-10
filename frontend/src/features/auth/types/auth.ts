export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  token?: string;
  sellerMode?: boolean;
  profileCompleted?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  error?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  phone?: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface ToggleSellerModePayload {
  enabled: boolean;
  description?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
}
