import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
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

const API_BASE = process.env.EXPO_PUBLIC_API_URL ? 
  `${process.env.EXPO_PUBLIC_API_URL}/api/chat` : 
  "http://192.168.0.104:5000/api/chat";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired - clear storage and redirect to login
      AsyncStorage.removeItem("authToken");
      // You could add navigation logic here if needed
    }
    return Promise.reject(error);
  }
);

export const fetchChatsThunk = createAsyncThunk<
  ChatsResponse,
  ChatSearchParams,
  { rejectValue: string }
>(
  "chat/fetchChats",
  async (searchParams: ChatSearchParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ChatsResponse>("/", { params: searchParams });
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
      const response = await apiClient.get<ChatResponse>(`/${chatId}`);
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
      const response = await apiClient.post<ChatResponse>("/", chatData);
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
      const response = await apiClient.get<MessagesResponse>(`/${chatId}/messages`, { params });
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
      console.log("Messages fetch error:", error.response?.data || error.message);
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
      const response = await apiClient.post<MessageResponse>(`/${chatId}/messages`, messageData);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error: any) {
      console.log("=== SEND MESSAGE ERROR ===");
      console.log("Error:", error);
      console.log("Error Response:", error.response);
      console.log("Error Status:", error.response?.status);
      console.log("Error Data:", error.response?.data);
      
      // If chat not found (404), try to create a new chat first
      if (error.response?.status === 404 && error.response?.data?.error === "Chat not found") {
        try {
          // Extract participant ID from chatId (assuming chatId is the recipient's user ID for new chats)
          const participantId = chatId;
          
          // Create new chat
          const createChatResult = await dispatch(createChatThunk({
            participant_id: participantId
          }) as any);

          if (createChatResult.payload && (createChatResult.payload.data || createChatResult.payload.id)) {
            const newChat = createChatResult.payload.data || createChatResult.payload;

            // Now try to send the message to the newly created chat
            const retryResponse = await apiClient.post<MessageResponse>(`/${newChat.id}/messages`, messageData);
            return {
              success: true,
              data: retryResponse.data.data || retryResponse.data
            };
          } else {
            console.error("Failed to create new chat:", createChatResult.payload);
            return rejectWithValue("Failed to create new chat");
          }
        } catch (createError: any) {
          console.error("Error creating new chat:", createError);
          const errorMessage = createError.response?.data?.error || createError.message || "Failed to create new chat";
          return rejectWithValue(errorMessage);
        }
      }
      
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to send message";
      console.error("Send message failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Find or create chat by user IDs and listing ID
export const findOrCreateChatByUsersThunk = createAsyncThunk(
  'chat/findOrCreateChatByUsers',
  async ({ participant1Id, participant2Id, listingId }: { participant1Id?: string; participant2Id?: string; listingId?: string }, { rejectWithValue, getState, dispatch }) => {
    try {
      const state = getState() as any;
      const token = state.auth.accessToken || state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Build query URL with both participant IDs and listing ID
      let findChatUrl = `${API_BASE}/find-by-users?participant1_id=${participant1Id}&participant2_id=${participant2Id}`;
      
      if (listingId) {
        findChatUrl += `&listing_id=${listingId}`;
      }

      const response = await axios.get(findChatUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        return response.data;
      } else {
        throw new Error('Failed to find or create chat');
      }
      
    } catch (error: any) {
      console.error('=== FIND OR CREATE CHAT ERROR ===');
      console.error('Error:', error);
      
      if (error.response) {
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', error.response.data);
        return rejectWithValue(error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
        return rejectWithValue({ error: 'No response from server' });
      } else {
        console.error('Error Message:', error.message);
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
