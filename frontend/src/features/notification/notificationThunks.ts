import { createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { 
  CreateNotificationPayload, 
  UpdateNotificationPayload,
  MarkAsReadPayload,
  MarkAllAsReadPayload,
  BulkDeletePayload,
  NotificationSearchParams,
  NotificationResponse, 
  NotificationsResponse,
  UnreadCountResponse,
  NotificationSettingsResponse,
  UpdateNotificationSettingsPayload,
  NotificationStatsResponse,
  PushNotificationPayload,
  EmailNotificationPayload
} from "./types/notification";

const API_BASE = "http://192.168.0.104:5000/api/notification";

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

export const fetchNotificationsThunk = createAsyncThunk<
  NotificationsResponse,
  NotificationSearchParams,
  { rejectValue: string }
>(
  "notification/fetchNotifications",
  async (searchParams: NotificationSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationsResponse>("/", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notifications";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchNotificationByIdThunk = createAsyncThunk<
  NotificationResponse,
  string,
  { rejectValue: string }
>(
  "notification/fetchNotificationById",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationResponse>(`/${notificationId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const createNotificationThunk = createAsyncThunk<
  NotificationResponse,
  CreateNotificationPayload,
  { rejectValue: string }
>(
  "notification/createNotification",
  async (notificationData: CreateNotificationPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<NotificationResponse>("/", notificationData);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateNotificationThunk = createAsyncThunk<
  NotificationResponse,
  { id: string; data: UpdateNotificationPayload },
  { rejectValue: string }
>(
  "notification/updateNotification",
  async ({ id, data }: { id: string; data: UpdateNotificationPayload }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<NotificationResponse>(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "notification/deleteNotification",
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/${notificationId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markAsReadThunk = createAsyncThunk<
  void,
  MarkAsReadPayload,
  { rejectValue: string }
>(
  "notification/markAsRead",
  async (payload: MarkAsReadPayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/mark-read", payload);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to mark notifications as read";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markAllAsReadThunk = createAsyncThunk<
  void,
  MarkAllAsReadPayload,
  { rejectValue: string }
>(
  "notification/markAllAsRead",
  async (payload: MarkAllAsReadPayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/mark-all-read", payload);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to mark all notifications as read";
      return rejectWithValue(errorMessage);
    }
  }
);

export const bulkDeleteThunk = createAsyncThunk<
  void,
  BulkDeletePayload,
  { rejectValue: string }
>(
  "notification/bulkDelete",
  async (payload: BulkDeletePayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/bulk-delete", payload);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete notifications";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUnreadCountThunk = createAsyncThunk<
  UnreadCountResponse,
  void,
  { rejectValue: string }
>(
  "notification/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<UnreadCountResponse>("/unread-count");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch unread count";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUnreadNotificationsThunk = createAsyncThunk<
  NotificationsResponse,
  NotificationSearchParams,
  { rejectValue: string }
>(
  "notification/fetchUnreadNotifications",
  async (searchParams: NotificationSearchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationsResponse>("/unread", { params: searchParams });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch unread notifications";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchNotificationsByTypeThunk = createAsyncThunk<
  NotificationsResponse,
  { type: string; params?: NotificationSearchParams },
  { rejectValue: string }
>(
  "notification/fetchNotificationsByType",
  async ({ type, params = {} }: { type: string; params?: NotificationSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationsResponse>(`/type/${type}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notifications by type";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchNotificationsByPriorityThunk = createAsyncThunk<
  NotificationsResponse,
  { priority: string; params?: NotificationSearchParams },
  { rejectValue: string }
>(
  "notification/fetchNotificationsByPriority",
  async ({ priority, params = {} }: { priority: string; params?: NotificationSearchParams }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationsResponse>(`/priority/${priority}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notifications by priority";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchNotificationSettingsThunk = createAsyncThunk<
  NotificationSettingsResponse,
  void,
  { rejectValue: string }
>(
  "notification/fetchNotificationSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationSettingsResponse>("/settings");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notification settings";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateNotificationSettingsThunk = createAsyncThunk<
  NotificationSettingsResponse,
  UpdateNotificationSettingsPayload,
  { rejectValue: string }
>(
  "notification/updateNotificationSettings",
  async (settings: UpdateNotificationSettingsPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.put<NotificationSettingsResponse>("/settings", settings);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to update notification settings";
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchNotificationStatsThunk = createAsyncThunk<
  NotificationStatsResponse,
  void,
  { rejectValue: string }
>(
  "notification/fetchNotificationStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationStatsResponse>("/stats");
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notification stats";
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendPushNotificationThunk = createAsyncThunk<
  void,
  PushNotificationPayload,
  { rejectValue: string }
>(
  "notification/sendPushNotification",
  async (payload: PushNotificationPayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/send-push", payload);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to send push notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const sendEmailNotificationThunk = createAsyncThunk<
  void,
  EmailNotificationPayload,
  { rejectValue: string }
>(
  "notification/sendEmailNotification",
  async (payload: EmailNotificationPayload, { rejectWithValue }) => {
    try {
      await apiClient.post("/send-email", payload);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to send email notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const clearExpiredNotificationsThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "notification/clearExpiredNotifications",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post("/clear-expired");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to clear expired notifications";
      return rejectWithValue(errorMessage);
    }
  }
);

export const testNotificationThunk = createAsyncThunk<
  NotificationResponse,
  { type: string; message?: string },
  { rejectValue: string }
>(
  "notification/testNotification",
  async ({ type, message = "This is a test notification" }: { type: string; message?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<NotificationResponse>("/test", { type, message });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to send test notification";
      return rejectWithValue(errorMessage);
    }
  }
);
