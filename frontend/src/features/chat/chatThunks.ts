import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type {
  SendMessagePayload,
  CreateChatPayload,
  ChatResponse,
  ChatsResponse,
  MessagesResponse,
  Message,
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
  { page?: number; limit?: number },
  { rejectValue: string }
>("chat/fetchChats", async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<ChatsResponse>("/", {
      params: { page, limit },
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to fetch chats";
    return rejectWithValue(errorMessage);
  }
});

export const fetchChatByIdThunk = createAsyncThunk<
  ChatResponse,
  string,
  { rejectValue: string }
>("chat/fetchChatById", async (chatId: string, { rejectWithValue }) => {
  try {
    const response = await apiClient.get<ChatResponse>(`/${chatId}`);
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to fetch chat";
    return rejectWithValue(errorMessage);
  }
});

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
  { chatId: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  "chat/fetchMessages",
  async ({ chatId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<MessagesResponse>(
        `/${chatId}/messages`,
        {
          params: { page, limit },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch messages";
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendMessageThunk = createAsyncThunk<
  Message,
  SendMessagePayload,
  { rejectValue: string }
>(
  "chat/sendMessage",
  async (messageData: SendMessagePayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<Message>("/message", messageData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to send message";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markAsReadThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("chat/markAsRead", async (chatId: string, { rejectWithValue }) => {
  try {
    await apiClient.post(`/${chatId}/read`);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to mark as read";
    return rejectWithValue(errorMessage);
  }
});

export const deleteMessageThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("chat/deleteMessage", async (messageId: string, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/message/${messageId}`);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error ||
      error.message ||
      "Failed to delete message";
    return rejectWithValue(errorMessage);
  }
});

export const uploadChatImageThunk = createAsyncThunk<
  { image_url: string },
  { chatId: string; uri: string; type: string },
  { rejectValue: string }
>(
  "chat/uploadImage",
  async (
    { chatId, uri, type }: { chatId: string; uri: string; type: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: uri,
        type: type,
        name: "chat_image.jpg",
      } as any);

      const response = await apiClient.post<{ image_url: string }>(
        `/${chatId}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to upload image";
      return rejectWithValue(errorMessage);
    }
  }
);

export const searchChatsThunk = createAsyncThunk<
  ChatsResponse,
  { query: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  "chat/searchChats",
  async ({ query, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<ChatsResponse>("/search", {
        params: { query, page, limit },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to search chats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const blockUserThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("chat/blockUser", async (userId: string, { rejectWithValue }) => {
  try {
    await apiClient.post(`/block/${userId}`);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to block user";
    return rejectWithValue(errorMessage);
  }
});

export const unblockUserThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("chat/unblockUser", async (userId: string, { rejectWithValue }) => {
  try {
    await apiClient.post(`/unblock/${userId}`);
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || error.message || "Failed to unblock user";
    return rejectWithValue(errorMessage);
  }
});
