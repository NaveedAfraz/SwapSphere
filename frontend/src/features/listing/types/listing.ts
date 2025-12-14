export type ListingStatus = "idle" | "loading" | "success" | "error";

export type Condition = "new" | "like_new" | "good" | "fair" | "poor";

export type Category = 
  | "electronics"
  | "fashion"
  | "home"
  | "sports"
  | "books"
  | "toys"
  | "automotive"
  | "health"
  | "other";

export interface ListingImage {
  id: string;
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
  order: number;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: string; // API returns string, not number
  category: Category;
  condition: Condition;
  primary_image_url?: string; // API returns single primary image URL
  location: Location;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_rating?: number;
  seller_verified?: boolean;
  store_name?: string;
  tags?: string[];
  is_published: boolean;
  is_favorite?: boolean; // Added for favorite tracking
  visibility: "public" | "private";
  view_count: string; // API returns string
  favorites_count: string; // API returns string
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  search_vector?: string;
  metadata?: any;
  quantity: number;
  currency: string;
}

export interface ListingState {
  listings: Listing[];
  currentListing: Listing | null;
  favorites: Listing[];
  status: ListingStatus;
  error: string | null;
  createStatus: ListingStatus;
  createError: string | null;
  updateStatus: ListingStatus;
  updateError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    category?: Category;
    condition?: Condition;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    search?: string;
    sortBy?: "created_at" | "price" | "popularity";
    sortOrder?: "asc" | "desc";
  };
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  category: Category;
  condition: Condition;
  location: Location;
  images: ListingImage[];
}

export interface UpdateListingPayload {
  title?: string;
  description?: string;
  price?: number;
  category?: Category;
  condition?: Condition;
  location?: Location;
  status?: "active" | "sold" | "pending" | "removed";
}

export interface SearchParams {
  category?: Category;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "price" | "popularity";
  sortOrder?: "asc" | "desc";
}

export interface ListingResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface SingleListingResponse {
  listing: Listing;
}
