export type UserStatus = "idle" | "loading" | "success" | "error";

export interface UserProfile {
  id: string;
  name?: string;
  bio?: string;
  avatar?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  seller_mode?: boolean;
  rating?: number;
  review_count?: number;
  response_rate?: number;
  avg_response_time?: number; // in minutes
  verification_status?: "pending" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_listings: number;
  active_listings: number;
  sold_items: number;
  purchased_items: number;
  total_revenue: number;
  avg_rating: number;
  review_count: number;
  member_since: string;
}

export interface UserState {
  profile: UserProfile | null;
  stats: UserStats | null;
  status: UserStatus;
  error: string | null;
  updateStatus: UserStatus;
  updateError: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatar?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export interface ToggleSellerModePayload {
  enabled: boolean;
  description?: string;
}

export interface UserResponse {
  user: UserProfile;
  stats?: UserStats;
}
