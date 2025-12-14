export type NotificationStatus = "idle" | "loading" | "success" | "error";

export type NotificationType = 
  | "message"
  | "offer"
  | "order"
  | "payment"
  | "review"
  | "listing"
  | "system"
  | "promotion"
  | "reminder"
  | "alert";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any; // Additional data related to the notification
  action_url?: string; // URL to navigate when notification is tapped
  action_text?: string; // Text for action button
  is_read: boolean;
  is_push_sent: boolean;
  is_email_sent: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
}

export interface NotificationStateType {
  notifications: Notification[];
  unreadNotifications: Notification[];
  currentNotification: Notification | null;
  status: NotificationStatus;
  error: string | null;
  createStatus: NotificationStatus;
  createError: string | null;
  updateStatus: NotificationStatus;
  updateError: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    type?: NotificationType;
    priority?: NotificationPriority;
    is_read?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: "created_at" | "updated_at" | "priority";
    sortOrder?: "asc" | "desc";
  };
  settings: {
    push_enabled: boolean;
    email_enabled: boolean;
    message_notifications: boolean;
    offer_notifications: boolean;
    order_notifications: boolean;
    payment_notifications: boolean;
    review_notifications: boolean;
    listing_notifications: boolean;
    system_notifications: boolean;
    promotion_notifications: boolean;
    reminder_notifications: boolean;
    alert_notifications: boolean;
  };
  stats: {
    total_notifications: number;
    unread_count: number;
    read_count: number;
    push_sent_count: number;
    email_sent_count: number;
    expired_count: number;
    type_distribution: Record<NotificationType, number>;
    priority_distribution: Record<NotificationPriority, number>;
  };
}

export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  action_url?: string;
  action_text?: string;
  expires_at?: string;
}

export interface UpdateNotificationPayload {
  title?: string;
  message?: string;
  data?: any;
  action_url?: string;
  action_text?: string;
  expires_at?: string;
}

export interface MarkAsReadPayload {
  notification_ids: string[];
}

export interface MarkAllAsReadPayload {
  user_id: string;
}

export interface BulkDeletePayload {
  notification_ids: string[];
}

export interface NotificationSearchParams {
  type?: NotificationType;
  priority?: NotificationPriority;
  is_read?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "created_at" | "updated_at" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface NotificationResponse {
  notification: Notification;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationSettingsResponse {
  settings: NotificationStateType["settings"];
}

export interface UpdateNotificationSettingsPayload {
  push_enabled?: boolean;
  email_enabled?: boolean;
  message_notifications?: boolean;
  offer_notifications?: boolean;
  order_notifications?: boolean;
  payment_notifications?: boolean;
  review_notifications?: boolean;
  listing_notifications?: boolean;
  system_notifications?: boolean;
  promotion_notifications?: boolean;
  reminder_notifications?: boolean;
  alert_notifications?: boolean;
}

export interface NotificationStatsResponse {
  stats: NotificationStateType["stats"];
}

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
