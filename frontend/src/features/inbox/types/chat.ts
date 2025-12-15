export interface Chat {
  id: string;
  listing_id?: string;
  last_message_id?: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  last_message?: Message;
  unread_count?: number;
  listing?: Listing;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: string;
  last_read_at?: string;
  muted: boolean;
  created_at: string;
  user?: User;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  recipient_id?: string;
  body?: string;
  attachments?: any[];
  is_read: boolean;
  is_system: boolean;
  created_at: string;
  read_at?: string;
  sender?: User;
}

export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: any;
  profile?: Profile;
}

export interface Profile {
  id: string;
  user_id: string;
  name?: string;
  avatar_key?: string;
  bio?: string;
  seller_mode: boolean;
  rating_avg: number;
  rating_count: number;
  location?: any;
  metadata?: any;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  condition?: string;
  category?: string;
  location?: any;
  tags?: string[];
  is_published: boolean;
  visibility: string;
  metadata?: any;
  view_count: number;
  favorites_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  primary_image_url?: string;
  seller_name?: string;
  seller_rating?: number;
}

// API Response Types
export interface ChatResponse {
  success: boolean;
  data: Chat;
}

export interface ChatsResponse {
  success: boolean;
  data: Chat[];
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
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Payload Types
export interface CreateChatPayload {
  listing_id?: string;
  participant_id?: string;
}

export interface SendMessagePayload {
  body?: string;
  attachments?: any[];
  recipient_id?: string;
}

export interface ChatSearchParams {
  page?: number;
  limit?: number;
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

// Redux State Types
export interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Record<string, Message[]>;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  subscriptions: Record<string, boolean>;
  typing: Record<string, boolean>;
}

export interface ConversationInfo {
  id: string;
  name: string;
  avatar: string;
  itemName: string;
  itemImage: string;
  originalPrice: number;
  currentOffer?: number;
  isOwnOffer?: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
}
