import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/src/services/api";
import type { 
  ChatResponse,
  MessageResponse,
  CreateChatPayload,
  SendMessagePayload,
  ChatSearchParams,
  MessageSearchParams,
  ChatsResponse,
  MessagesResponse
} from "./types/chat";

const API_BASE = "/api/chat"; // Use relative path with unified API client

export const fetchChatsThunk = createAsyncThunk<
  ChatsResponse,
  ChatSearchParams,
  { rejectValue: string }
>(
  "chat/fetchChats",
  async (searchParams: ChatSearchParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ChatsResponse>("/chat", { params: searchParams });
      return {
        success: true,
        chats: response.data.chats || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch chats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchChatByIdThunk = createAsyncThunk<
  ChatResponse,
  string,
  { rejectValue: string }
>(
  "chat/fetchChatById",
  async (chatId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ChatResponse>(`/chat/${chatId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch chat";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createChatThunk = createAsyncThunk<
  ChatResponse,
  CreateChatPayload,
  { rejectValue: string }
>(
  "chat/createChat",
  async (chatData: CreateChatPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<ChatResponse>("/chat", chatData);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create chat";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchMessagesThunk = createAsyncThunk<
  MessagesResponse,
  { chatId: string; params?: MessageSearchParams },
  { rejectValue: string }
>(
  "chat/fetchMessages",
  async ({ chatId, params = {} }: { chatId: string; params?: MessageSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<MessagesResponse>(`/chat/${chatId}/messages`, { params });
      return {
        success: true,
        messages: response.data.messages || [],
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        },
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch messages";
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendMessageThunk = createAsyncThunk<
  MessageResponse,
  { chatId: string; messageData: SendMessagePayload },
  { rejectValue: string }
>(
  "chat/sendMessage",
  async ({ chatId, messageData }: { chatId: string; messageData: SendMessagePayload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post<MessageResponse>(`/chat/${chatId}/messages`, messageData);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      console.error("Send message error:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Find or create chat by user IDs and listing ID
export const findOrCreateChatByUsersThunk = createAsyncThunk(
  'chat/findOrCreateChatByUsers',
  async ({ participant1Id, participant2Id, listingId }: { participant1Id?: string; participant2Id?: string; listingId?: string }, { rejectWithValue }) => {
    try {
      // Build query URL with both participant IDs and listing ID
      let findChatUrl = `/chat/find-by-users?participant1_id=${participant1Id}&participant2_id=${participant2Id}`;
      
      if (listingId) {
        findChatUrl += `&listing_id=${listingId}`;
      }

      const response = await apiClient.get(findChatUrl);

      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to find or create chat');
      }
      
    } catch (error: any) {
      console.error('Find or create chat error:', error);
      
      if (error.response) {
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        return rejectWithValue({ error: 'No response from server' });
      } else {
        return rejectWithValue({ error: error.message });
      }
    }
  }
);

export const sendMessageOrCreateChatThunk = createAsyncThunk<
  MessageResponse,
  { recipientId: string; messageData: SendMessagePayload; listingId?: string },
  { rejectValue: string }
>(
  "chat/sendMessageOrCreateChat",
  async ({ recipientId, messageData, listingId }: { recipientId: string; messageData: SendMessagePayload; listingId?: string }, { rejectWithValue, dispatch }) => {
    try {
      // First, try to create a chat (this will return existing chat if it already exists)
      const createChatResult = await dispatch(createChatThunk({
        participant_id: recipientId,
        listing_id: listingId
      }) as any);
      
      // Check if chat creation was successful
      if (createChatResult.payload && (createChatResult.payload.data || createChatResult.payload.id)) {
        const chat = createChatResult.payload.data || createChatResult.payload;
        
        // Now send the message to this chat
        const messageResult = await dispatch(sendMessageThunk({
          chatId: chat.id,
          messageData: messageData
        }) as any);
        
        if (messageResult.payload && (messageResult.payload.data || messageResult.payload.id)) {
          const message = messageResult.payload.data || messageResult.payload;
          if (messageResult.meta.requestStatus === 'rejected') {
            return rejectWithValue('Failed to send message');
          }
          return message;
        } else {
          console.error("Failed to send message:", messageResult.payload);
          return rejectWithValue(messageResult.payload || "Failed to send message");
        }
      } else {
        console.error("Failed to create/find chat:", createChatResult.payload);
        return rejectWithValue(createChatResult.payload || "Failed to create chat");
      }
    } catch (error: any) {
      console.error("Error in send message or create chat:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to send message or create chat";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markMessagesAsReadThunk = createAsyncThunk<
  void,
  { chatId: string; messageIds?: string[] },
  { rejectValue: string }
>(
  "chat/markMessagesAsRead",
  async ({ chatId, messageIds }: { chatId: string; messageIds?: string[] }, { rejectWithValue }) => {
    try {
      await apiClient.post(`/${chatId}/messages/read`, { message_ids: messageIds });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to mark messages as read";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteMessageThunk = createAsyncThunk<
  void,
  { chatId: string; messageId: string },
  { rejectValue: string }
>(
  "chat/deleteMessage",
  async ({ chatId, messageId }: { chatId: string; messageId: string }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/${chatId}/messages/${messageId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete message";
      return rejectWithValue(errorMessage);
    }
  }
);

// Real-time message subscription (for WebSocket integration)
export const subscribeToChatThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "chat/subscribeToChat",
  async (chatId: string, { rejectWithValue }) => {
    try {
      // This would integrate with WebSocket for real-time updates
      // For now, we'll just return success
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to subscribe to chat";
      return rejectWithValue(errorMessage);
    }
  }
);

export const unsubscribeFromChatThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "chat/unsubscribeFromChat",
  async (chatId: string, { rejectWithValue }) => {
    try {
      // This would integrate with WebSocket for real-time updates
      // For now, we'll just return success
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to unsubscribe from chat";
      return rejectWithValue(errorMessage);
    }
  }
);
