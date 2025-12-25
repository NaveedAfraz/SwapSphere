export interface SwapItem {
  listingId: string;
  title: string;
  image: string;
  price: string;
  condition: string;
}

export interface DealOffer {
  id: string;
  dealRoomId: string;
  type: "cash" | "swap" | "hybrid";
  cashAmount: number;
  swapItems: SwapItem[];
  status: "pending" | "countered" | "accepted";
  createdAt: string;
  updatedAt: string;
  buyerId: string;
  sellerId: string;
  metadata?: {
    made_by_user_id?: string;
    is_seller_swap_offer?: boolean;
    countered_by_user_id?: string;
    countered_at?: string;
    is_seller_counter?: boolean;
    updated_by_user_id?: string;
    updated_at?: string;
    is_seller_update?: boolean;
    [key: string]: any;
  };
}

export interface SwapOfferPayload {
  type: "swap" | "hybrid";
  cashAmount?: number;
  swapItems: {
    listingId: string;
    title: string;
    image: string;
  }[];
}

export interface UserListingForSwap {
  id: string;
  title: string;
  primary_image_url?: string;
  price: string;
  condition: string;
  category: string;
  is_selected?: boolean;
}
