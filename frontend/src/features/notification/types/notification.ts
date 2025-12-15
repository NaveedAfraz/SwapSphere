export type NotificationStatus = "idle" | "loading" | "success" | "error";

// Database-based notification types matching the backend
export type NotificationType = 
  | "offer_received"
  | "offer_countered" 
  | "offer_accepted"
  | "offer_declined"
  | "message_received"
  | "listing_favorited"
  | "listing_sold"
  | "payment_received"
  | "review_received"
  | "system_update";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

// Database-aligned Notification interface
export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  type: NotificationType;
  payload: any; // JSONB payload containing notification-specific data
  is_read: boolean;
  status?: string; // Offer status field (e.g., 'pending', 'accepted', 'declined')
  delivered_at?: string;
  created_at: string;
  // Optional fields for enhanced functionality
  actor?: {
    id: string;
    email?: string;
    profile?: {
      name?: string;
      avatar_key?: string;
    };
  };
}

export interface NotificationStateType {
  notifications: Notification[];
  unreadNotifications: Notification[];
  currentNotification: Notification | null;
  status: NotificationStatus;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    sortBy?: string;
    sortOrder?: string;
  };
  // Removed unused properties: createStatus, createError, updateStatus, updateError, settings, stats
}

export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  payload: any; // JSONB payload matching backend structure
  actor_id?: string;
}

export interface UpdateNotificationPayload {
  payload?: any;
  is_read?: boolean;
  delivered_at?: string;
}

export interface MarkAsReadPayload {
  notification_id: string; // Single notification ID for database structure
}

export interface MarkAllAsReadPayload {
  user_id: string;
}

export interface BulkDeletePayload {
  notification_ids: string[];
}

export interface NotificationSearchParams {
  type?: NotificationType;
  is_read?: boolean;
  actor_id?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "delivered_at";
  sortOrder?: "asc" | "desc";
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Removed NotificationSettingsResponse and related interfaces as settings are no longer used
// Removed NotificationStatsResponse and related interfaces as stats are no longer used

export interface PushNotificationPayload {
  user_id: string;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
}

export interface EmailNotificationPayload {
  user_id: string;
  subject: string;
  template: string;
  data?: any;
  priority?: NotificationPriority;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  name: string;
  title_template: string;
  message_template: string;
  action_url_template?: string;
  action_text_template?: string;
  default_priority: NotificationPriority;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplatesResponse {
  templates: NotificationTemplate[];
}
