export type ChatStatus = "idle" | "loading" | "success" | "error";

export type MessageType = "text" | "image" | "offer" | "system";

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  type: MessageType;
  metadata?: {
    offer_id?: string;
    image_url?: string;
    file_name?: string;
    file_size?: number;
  };
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  participant1_name?: string;
  participant2_name?: string;
  participant1_avatar?: string;
  participant2_avatar?: string;
  listing_id?: string;
  listing_title?: string;
  listing_image?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  status: ChatStatus;
  error: string | null;
  sendMessageStatus: ChatStatus;
  sendMessageError: string | null;
  markAsReadStatus: ChatStatus;
  markAsReadError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  typingUsers: string[];
  onlineUsers: string[];
}

export interface SendMessagePayload {
  chat_id: string;
  content: string;
  type: MessageType;
  metadata?: {
    offer_id?: string;
    image_url?: string;
    file_name?: string;
    file_size?: number;
  };
}

export interface CreateChatPayload {
  participant_id: string;
  listing_id?: string;
  initial_message?: string;
}

export interface ChatResponse {
  chat: Chat;
  messages?: Message[];
}

export interface ChatsResponse {
  chats: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface TypingPayload {
  chat_id: string;
  is_typing: boolean;
}

export interface OnlineStatusPayload {
  user_id: string;
  is_online: boolean;
}
