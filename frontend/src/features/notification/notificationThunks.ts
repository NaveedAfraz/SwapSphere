import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiClient } from "@/src/services/api";
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
  PushNotificationPayload,
  EmailNotificationPayload
} from "./types/notification";
import { markAsReadLocal } from "./notificationSlice";

export const fetchNotificationsThunk = createAsyncThunk<
  NotificationsResponse,
  NotificationSearchParams,
  { rejectValue: string }
>(
  "notification/fetchNotifications",
  async (searchParams: NotificationSearchParams = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get<NotificationsResponse>("/notification", { params: searchParams });
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
      const response = await apiClient.get<NotificationResponse>(`/notification/${notificationId}`);
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
      const response = await apiClient.post<NotificationResponse>("/notification", notificationData);
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
      const response = await apiClient.put<NotificationResponse>(`/notification/${id}`, data);
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
      await apiClient.delete(`/notification/${notificationId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to delete notification";
      return rejectWithValue(errorMessage);
    }
  }
);

export const markAsReadThunk = createAsyncThunk<
  { notification_id: string },
  string, // Single notification ID
  { rejectValue: string }
>(
  "notification/markAsRead",
  async (notificationId: string, { rejectWithValue, dispatch }) => {
    try {
      // Optimistic update - mark as read locally immediately
      dispatch(markAsReadLocal(notificationId));
      
      // Then make the API call
      await apiClient.post(`/notification/${notificationId}/read`);
      return { notification_id: notificationId };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to mark notification as read";
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
      await apiClient.post("/notification/mark-all-read", payload);
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
      await apiClient.post("/notification/bulk-delete", payload);
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
      const response = await apiClient.get<UnreadCountResponse>("/notification/unread-count");
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
      const response = await apiClient.get<NotificationsResponse>("/notification/unread", { params: searchParams });
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
      const response = await apiClient.get<NotificationsResponse>(`/notification/type/${type}`, { params });
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
      const response = await apiClient.get<NotificationsResponse>(`/notification/priority/${priority}`, { params });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch notifications by priority";
      return rejectWithValue(errorMessage);
    }
  }
);

// Removed unused thunks: fetchNotificationSettingsThunk, updateNotificationSettingsThunk, fetchNotificationStatsThunk
// These were removed as part of the notification slice cleanup since settings and stats are no longer used

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
