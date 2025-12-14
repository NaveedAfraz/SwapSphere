export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  token?: string;
  sellerMode?: boolean;
  profileCompleted?: boolean;
  profile?: {
    id: string;
    name?: string;
    bio?: string;
    seller_mode?: boolean;
    rating_avg?: string;
    rating_count?: number;
    avatar_key?: string;
    profile_picture_url?: string;
    profile_picture_mime_type?: string;
    profile_picture_size_bytes?: string;
  };
  seller?: {
    id: string;
    store_name?: string;
    bio?: string;
    seller_rating?: string;
    total_sales?: string;
  };
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
