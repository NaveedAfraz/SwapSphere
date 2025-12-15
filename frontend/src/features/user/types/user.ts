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
  fetchedUser: UserProfile | null;
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

export interface UserByIdResponse {
  id: string;
  email: string;
  is_active: boolean;
  phone?: string;
  created_at: string;
  profile: {
    id: string;
    name?: string;
    bio?: string;
    profile_picture_url?: string;
    location?: {
      city?: string;
    };
    rating_avg: string;
    rating_count: number;
    seller_mode: boolean;
  };
  seller?: {
    id: string;
    store_name: string;
    seller_rating: string;
    total_sales: string;
  };
}
