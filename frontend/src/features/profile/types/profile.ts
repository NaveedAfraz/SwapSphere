export type ProfileStatus = "idle" | "loading" | "success" | "error";

export type ProfileVisibility = "public" | "private" | "friends_only";

export type VerificationStatus = "not_verified" | "pending" | "verified" | "rejected";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  location?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  verification_status: VerificationStatus;
  verification_documents?: string[];
  is_seller: boolean;
  seller_info?: {
    business_name?: string;
    business_description?: string;
    business_hours?: string;
    response_rate?: number;
    response_time?: string;
    total_sales?: number;
    average_rating?: number;
    total_reviews?: number;
  };
  preferences?: {
    visibility: ProfileVisibility;
    show_email: boolean;
    show_phone: boolean;
    allow_messages: boolean;
    allow_offers: boolean;
    notification_settings: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  stats?: {
    total_listings: number;
    active_listings: number;
    sold_items: number;
    total_reviews: number;
    average_rating: number;
    member_since: string;
    last_active: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProfileStateType {
  currentProfile: Profile | null;
  publicProfile: Profile | null;
  status: ProfileStatus;
  error: string | null;
  updateStatus: ProfileStatus;
  updateError: string | null;
  verificationStatus: ProfileStatus;
  verificationError: string | null;
  uploadStatus: ProfileStatus;
  uploadError: string | null;
}

export interface UpdateProfilePayload {
  display_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  preferences?: {
    visibility?: ProfileVisibility;
    show_email?: boolean;
    show_phone?: boolean;
    allow_messages?: boolean;
    allow_offers?: boolean;
    notification_settings?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
}

export interface UpdateSellerInfoPayload {
  business_name?: string;
  business_description?: string;
  business_hours?: string;
}

export interface UploadAvatarPayload {
  image_uri: string;
  file_name?: string;
}

export interface UploadCoverImagePayload {
  image_uri: string;
  file_name?: string;
}

export interface VerificationDocumentPayload {
  document_type: string;
  document_uri: string;
  file_name?: string;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface PublicProfileResponse {
  profile: Profile;
}

export interface ProfileStatsResponse {
  stats: Profile["stats"];
}

export interface VerificationResponse {
  status: VerificationStatus;
  message?: string;
  documents_required?: string[];
}
