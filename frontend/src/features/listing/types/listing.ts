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
  price: number;
  category: Category;
  condition: Condition;
  images: ListingImage[];
  location: Location;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_rating?: number;
  status: "active" | "sold" | "pending" | "removed";
  is_favorite?: boolean;
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
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
