export type SalesStatus = "idle" | "loading" | "success" | "error";

export interface Sale {
  order_id: string;
  total_amount: number;
  currency: string;
  order_status: string;
  order_created_at: string;
  order_updated_at: string;
  listing_title: string;
  listing_images?: string[];
  listing_price: number;
  listing_category: string;
  buyer_username: string;
  buyer_avatar?: string;
  payment_status?: string;
  provider_payment_id?: string;
  deal_room_id?: string;
  deal_room_state?: string;
}

export interface SalesStats {
  total_sales: number;
  total_revenue: number;
  pending_orders: number;
  completed_orders: number;
}

export interface SalesPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SalesResponse {
  sales: Sale[];
  pagination: SalesPagination;
  stats: SalesStats;
}

export interface DealEvent {
  event_type: string;
  payload: any;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
}

export interface SaleDetails extends Sale {
  order_metadata?: any;
  listing_id: string;
  listing_description?: string;
  listing_condition?: string;
  buyer_id: string;
  buyer_email: string;
  payment_id?: string;
  payment_amount?: number;
  provider?: string;
  payment_metadata?: any;
  payment_created_at?: string;
  deal_room_metadata?: any;
  offered_price?: number;
  offer_status?: string;
  offer_created_at?: string;
  events: DealEvent[];
}

export interface SalesStateType {
  sales: Sale[];
  currentSale: SaleDetails | null;
  salesStats: SalesStats | null;
  pagination: SalesPagination | null;
  status: SalesStatus;
  error: string | null;
  detailsStatus: SalesStatus;
  detailsError: string | null;
}

export interface FetchSalesParams {
  page?: number;
  limit?: number;
  status?: string;
}
