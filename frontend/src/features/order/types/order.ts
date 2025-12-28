export type OrderStatus = "idle" | "loading" | "success" | "error";

export type OrderState = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "refunded" | "disputed";

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TrackingInfo {
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
  status: string;
  estimated_delivery?: string;
  updates?: {
    timestamp: string;
    status: string;
    location?: string;
    description: string;
  }[];
}

export interface Order {
  id: string;
  order_number: string;
  listing_id?: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    condition: string;
    description?: string;
    images: Array<{ url: string }>;
  };
  listing_title?: string;
  listing_image?: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_avatar?: string;
  seller_id: string;
  seller_name?: string;
  seller_avatar?: string;
  seller?: {
    store_name?: string;
  };
  store_name?: string;
  offer_id?: string;
  final_price?: number;
  total_amount?: number;
  quantity: number;
  status: OrderState;
  payment_status: "created" | "requires_action" | "succeeded" | "failed" | "refunded" | "canceled" | "escrowed";
  shipping_address?: ShippingAddress;
  tracking_info?: TrackingInfo;
  notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
}

export interface OrderStateType {
  orders: Order[];
  currentOrder: Order | null;
  myOrders: Order[];
  status: OrderStatus;
  error: string | null;
  createStatus: OrderStatus;
  createError: string | null;
  updateStatus: OrderStatus;
  updateError: null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    status?: OrderState;
    buyer_id?: string;
    seller_id?: string;
    payment_status?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "created_at" | "final_price" | "updated_at";
    sortOrder?: "asc" | "desc";
  };
}

export interface CreateOrderPayload {
  listing_id: string;
  offer_id?: string;
  quantity: number;
  shipping_address: ShippingAddress;
  notes?: string;
}

export interface UpdateOrderPayload {
  status?: OrderState;
  shipping_address?: ShippingAddress;
  tracking_info?: TrackingInfo;
  notes?: string;
}

export interface UpdateTrackingPayload {
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
  estimated_delivery?: string;
}

export interface OrderSearchParams {
  status?: OrderState;
  buyer_id?: string;
  seller_id?: string;
  payment_status?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "final_price" | "updated_at";
  sortOrder?: "asc" | "desc";
}

export interface OrderResponse {
  order: Order;
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  disputedOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
}

export interface DisputeInfo {
  id: string;
  order_id: string;
  initiated_by: string;
  reason: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "closed";
  resolution?: string;
  created_at: string;
  updated_at: string;
}
