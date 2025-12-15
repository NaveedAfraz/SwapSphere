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

const API_BASE = "http://192.168.0.104:5000/api/chat";

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

export const fetchChatsThunk = createAsyncThunk<
  ChatsResponse,
  ChatSearchParams,
  { rejectValue: string }
>(
  "chat/fetchChats",
  async (searchParams: ChatSearchParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ChatsResponse>("/", { params: searchParams });
      return response.data;
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
      return response.data;
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
      return response.data;
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
      return response.data;
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
  async ({ chatId, messageData }: { chatId: string; messageData: SendMessagePayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<MessageResponse>(`/${chatId}/messages`, messageData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to send message";
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
      await apiClient.post(`/${chatId}/read`, { message_ids: messageIds });
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
      console.log(`Subscribing to chat: ${chatId}`);
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
      console.log(`Unsubscribing from chat: ${chatId}`);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to unsubscribe from chat";
      return rejectWithValue(errorMessage);
    }
  }
);
