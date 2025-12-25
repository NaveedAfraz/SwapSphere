export type OfferStatus = "idle" | "loading" | "success" | "error";

export type OfferState = "pending" | "accepted" | "rejected" | "countered" | "withdrawn" | "expired";

export type OfferType = "cash" | "swap" | "hybrid";

export interface SwapItem {
  listing_id: string;
  title: string;
  image?: string;
  price: string;
  condition: string;
  category: string;
}

export interface Offer {
  id: string;
  listing_id: string;
  listing_title?: string;
  listing_image?: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_avatar?: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  amount: number;
  message?: string;
  status: OfferState;
  counter_amount?: number;
  counter_message?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Swap offer fields
  offer_type?: OfferType;
  cash_amount?: number;
  swap_items?: SwapItem[];
}

export interface OfferStateType {
  offers: Offer[];
  currentOffer: Offer | null;
  sentOffers: Offer[];
  receivedOffers: Offer[];
  status: OfferStatus;
  error: string | null;
  createStatus: OfferStatus;
  createError: string | null;
  updateStatus: OfferStatus;
  updateError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    status?: OfferState;
    listing_id?: string;
    buyer_id?: string;
    seller_id?: string;
    minAmount?: number;
    maxAmount?: number;
    sortBy?: "created_at" | "amount" | "expires_at";
    sortOrder?: "asc" | "desc";
  };
}

export interface CreateOfferPayload {
  listing_id: string;
  amount: number;
  message?: string;
  expires_at?: string;
  buyer_id: string; // Explicitly specify who is the buyer
  intent_id?: string; // For seller counter-offers to intents
  // Swap offer fields
  offer_type?: OfferType;
  cash_amount?: number;
  swap_items?: SwapItem[];
}

export interface UpdateOfferPayload {
  status?: OfferState;
  counter_amount?: number;
  counter_message?: string;
  expires_at?: string;
  // Swap offer fields
  offer_type?: OfferType;
  cash_amount?: number;
  swap_items?: SwapItem[];
}

export interface CounterOfferPayload {
  offer_id: string;
  counter_amount: number;
  counter_message?: string;
  expires_at?: string;
  // Swap offer fields
  offer_type?: OfferType;
  cash_amount?: number;
  swap_items?: SwapItem[];
}

export interface OfferSearchParams {
  status?: OfferState;
  listing_id?: string;
  buyer_id?: string;
  seller_id?: string;
  deal_room_id?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "amount" | "expires_at";
  sortOrder?: "asc" | "desc";
}

export interface OfferResponse {
  offer: Offer;
}

export interface OffersResponse {
  offers: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface OfferStats {
  totalSent: number;
  totalReceived: number;
  pendingSent: number;
  pendingReceived: number;
  acceptedSent: number;
  acceptedReceived: number;
  rejectedSent: number;
  rejectedReceived: number;
  totalValueSent: number;
  totalValueReceived: number;
  averageOfferAmount: number;
}
