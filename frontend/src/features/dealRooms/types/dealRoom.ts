export type DealRoomState =
  | "negotiation"
  | "payment_pending"
  | "payment_completed"
  | "shipping"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export type DealEventType =
  | "offer_created"
  | "offer_accepted"
  | "offer_declined"
  | "payment_initiated"
  | "payment_completed"
  | "order_created"
  | "state_changed"
  | "dispute_created"
  | "message_sent"
  | "system_message";

export interface DealEvent {
  id: string;
  deal_room_id: string;
  actor_id: string;
  actor_name?: string;
  actor_avatar?: string;
  event_type: DealEventType;
  payload: {
    offer?: any;
    order?: any;
    payment?: any;
    dispute?: any;
    message_id?: string;
    old_state?: DealRoomState;
    new_state?: DealRoomState;
    reason?: string;
  };
  created_at: string;
}

export interface Message {
  id: string;
  deal_room_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  body?: string;
  attachments?: any[];
  is_read: boolean;
  is_system: boolean;
  created_at: string;
}

export interface DealRoom {
  id: string;
  intent_id?: string;
  listing_id?: string;
  buyer_id: string;
  seller_id: string;
  current_state: DealRoomState;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Join data from related tables
  listing_title?: string;
  listing_description?: string;
  listing_price?: number;
  listing_currency?: string;
  listing_image?: string;

  buyer_name?: string;
  buyer_avatar?: string;

  seller_name?: string;
  seller_avatar?: string;
  seller_user_id?: string;

  // Computed fields
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
  latest_order_id?: string;
  order_status?: string;
  order_amount?: number;
  latest_offer?: {
    id: string;
    offered_price: number;
    status: string;
    created_at: string;
    buyer_id: string;
    seller_id: string;
    offer_type?: string;
  };

  // Related data
  messages?: Message[];
  events?: DealEvent[];
  offer_history?: OfferHistoryItem[];
}

export interface OfferHistoryItem {
  id: string;
  offered_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  buyer_id: string;
  seller_id: string;
  offer_type?: string;
  cash_amount?: number;
  swap_items?: any;
  counter_for?: string;
  buyer_name?: string;
  buyer_avatar?: string;
}

export interface DealRoomStateType {
  dealRooms: DealRoom[];
  currentDealRoom: DealRoom | null;
  messages: Record<string, Message[]>;
  events: Record<string, DealEvent[]>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  sendMessageStatus: "idle" | "loading" | "succeeded" | "failed";
  sendMessageError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  typing: Record<string, boolean>;
  onlineUsers: string[];
}

// API Payload Types
export interface CreateDealRoomPayload {
  intent_id?: string;
  listing_id: string;
  seller_id: string;
}

export interface SendMessagePayload {
  body?: string;
  attachments?: any[];
  is_system?: boolean;
}

export interface UpdateDealRoomStatePayload {
  state: DealRoomState;
  metadata?: Record<string, any>;
}

// API Response Types
export interface DealRoomResponse {
  success: boolean;
  data: DealRoom;
}

export interface DealRoomsResponse {
  success: boolean;
  deal_rooms: DealRoom[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MessageResponse {
  success: boolean;
  data: Message;
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DealEventsResponse {
  success: boolean;
  events: DealEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search/Filter Types
export interface DealRoomSearchParams {
  page?: number;
  limit?: number;
  state?: DealRoomState;
  listing_id?: string;
  unread_only?: boolean;
}

export interface MessageSearchParams {
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
  unread_only?: boolean;
}

export interface DealEventSearchParams {
  page?: number;
  limit?: number;
  event_type?: DealEventType;
}

// Socket Event Types
export interface SocketMessagePayload {
  dealRoomId: string;
  body?: string;
  attachments?: any[];
  is_system?: boolean;
}

export interface SocketTypingPayload {
  dealRoomId: string;
  isTyping: boolean;
}

export interface SocketDealStatePayload {
  dealRoomId: string;
  newState: DealRoomState;
  metadata?: Record<string, any>;
}

export interface SocketMessagesReadPayload {
  dealRoomId: string;
  messageIds: string[];
}
