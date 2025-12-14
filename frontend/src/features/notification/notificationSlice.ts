import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NotificationStateType, Notification, NotificationType, NotificationPriority } from './types/notification';

const initialState: NotificationStateType = {
  notifications: [],
  unreadNotifications: [],
  currentNotification: null,
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  updateStatus: 'idle',
  updateError: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  filters: {
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  settings: {
    push_enabled: true,
    email_enabled: true,
    message_notifications: true,
    offer_notifications: true,
    order_notifications: true,
    payment_notifications: true,
    review_notifications: true,
    listing_notifications: true,
    system_notifications: true,
    promotion_notifications: false,
    reminder_notifications: true,
    alert_notifications: true,
  },
  stats: {
    total_notifications: 0,
    unread_count: 0,
    read_count: 0,
    push_sent_count: 0,
    email_sent_count: 0,
    expired_count: 0,
    type_distribution: {
      message: 0,
      offer: 0,
      order: 0,
      payment: 0,
      review: 0,
      listing: 0,
      system: 0,
      promotion: 0,
      reminder: 0,
      alert: 0,
    },
    priority_distribution: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
  },
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Synchronous actions
    clearError: (state: NotificationStateType) => {
      state.error = null;
    },
    clearCreateError: (state: NotificationStateType) => {
      state.createError = null;
    },
    clearUpdateError: (state: NotificationStateType) => {
      state.updateError = null;
    },
    resetCreateStatus: (state: NotificationStateType) => {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetUpdateStatus: (state: NotificationStateType) => {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    setCurrentNotification: (state: NotificationStateType, action: PayloadAction<Notification | null>) => {
      state.currentNotification = action.payload;
    },
    updateFilters: (state: NotificationStateType, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state: NotificationStateType) => {
      state.filters = {
        sortBy: 'created_at',
        sortOrder: 'desc',
      };
    },
    clearNotifications: (state: NotificationStateType) => {
      state.notifications = [];
      state.unreadNotifications = [];
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      };
    },
    updateNotificationLocal: (state: NotificationStateType, action: PayloadAction<{ id: string; updates: Partial<Notification> }>) => {
      const { id, updates } = action.payload;
      
      // Update in main notifications array
      const index = state.notifications.findIndex(notification => notification.id === id);
      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
      }
      
      // Update in unread notifications if it's there
      const unreadIndex = state.unreadNotifications.findIndex(notification => notification.id === id);
      if (unreadIndex !== -1) {
        const updatedNotification = { ...state.unreadNotifications[unreadIndex], ...updates };
        state.unreadNotifications[unreadIndex] = updatedNotification;
        
        // If marked as read, remove from unread
        if (updates.is_read) {
          state.unreadNotifications.splice(unreadIndex, 1);
        }
      }
      
      // Update current notification
      if (state.currentNotification?.id === id) {
        state.currentNotification = { ...state.currentNotification, ...updates };
      }
    },
    removeNotificationLocal: (state: NotificationStateType, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter(notification => notification.id !== notificationId);
      state.unreadNotifications = state.unreadNotifications.filter(notification => notification.id !== notificationId);
      if (state.currentNotification?.id === notificationId) {
        state.currentNotification = null;
      }
    },
    addNotification: (state: NotificationStateType, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadNotifications.unshift(action.payload);
      }
    },
    markAsReadLocal: (state: NotificationStateType, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      
      // Update in main notifications
      const index = state.notifications.findIndex(notification => notification.id === notificationId);
      if (index !== -1) {
        state.notifications[index].is_read = true;
        state.notifications[index].read_at = new Date().toISOString();
      }
      
      // Remove from unread notifications
      state.unreadNotifications = state.unreadNotifications.filter(notification => notification.id !== notificationId);
      
      // Update current notification
      if (state.currentNotification?.id === notificationId) {
        state.currentNotification.is_read = true;
        state.currentNotification.read_at = new Date().toISOString();
      }
    },
    markAllAsReadLocal: (state: NotificationStateType) => {
      const now = new Date().toISOString();
      
      // Mark all notifications as read
      state.notifications.forEach(notification => {
        if (!notification.is_read) {
          notification.is_read = true;
          notification.read_at = now;
        }
      });
      
      // Clear unread notifications
      state.unreadNotifications = [];
      
      // Update current notification
      if (state.currentNotification && !state.currentNotification.is_read) {
        state.currentNotification.is_read = true;
        state.currentNotification.read_at = now;
      }
    },
    updateNotificationSettings: (state: NotificationStateType, action: PayloadAction<Partial<NotificationStateType['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    bulkRemoveNotifications: (state: NotificationStateType, action: PayloadAction<string[]>) => {
      const notificationIds = action.payload;
      state.notifications = state.notifications.filter(notification => !notificationIds.includes(notification.id));
      state.unreadNotifications = state.unreadNotifications.filter(notification => !notificationIds.includes(notification.id));
      if (state.currentNotification && notificationIds.includes(state.currentNotification.id)) {
        state.currentNotification = null;
      }
    },
    updateStats: (state: NotificationStateType, action: PayloadAction<Partial<NotificationStateType['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    incrementUnreadCount: (state: NotificationStateType) => {
      state.stats.unread_count += 1;
      state.stats.total_notifications += 1;
    },
    decrementUnreadCount: (state: NotificationStateType) => {
      if (state.stats.unread_count > 0) {
        state.stats.unread_count -= 1;
      }
      state.stats.read_count += 1;
    },
  },
  extraReducers: (builder: any) => {
    // Handle fetch notifications thunk
    builder
      .addCase('notification/fetchNotifications/pending', (state: NotificationStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('notification/fetchNotifications/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notifications: Notification[]; pagination: any }>) => {
        state.status = 'success';
        state.notifications = action.payload.notifications;
        state.unreadNotifications = action.payload.notifications.filter(n => !n.is_read);
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase('notification/fetchNotifications/rejected', (state: NotificationStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch notifications';
      });

    // Handle fetch notification by ID thunk
    builder
      .addCase('notification/fetchNotificationById/pending', (state: NotificationStateType) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase('notification/fetchNotificationById/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notification: Notification }>) => {
        state.status = 'success';
        state.currentNotification = action.payload.notification;
        state.error = null;
      })
      .addCase('notification/fetchNotificationById/rejected', (state: NotificationStateType, action: any) => {
        state.status = 'error';
        state.error = action.payload as string || 'Failed to fetch notification';
      });

    // Handle create notification thunk
    builder
      .addCase('notification/createNotification/pending', (state: NotificationStateType) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase('notification/createNotification/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notification: Notification }>) => {
        state.createStatus = 'success';
        const newNotification = action.payload.notification;
        state.notifications.unshift(newNotification);
        if (!newNotification.is_read) {
          state.unreadNotifications.unshift(newNotification);
        }
        state.createError = null;
      })
      .addCase('notification/createNotification/rejected', (state: NotificationStateType, action: any) => {
        state.createStatus = 'error';
        state.createError = action.payload as string || 'Failed to create notification';
      });

    // Handle update notification thunk
    builder
      .addCase('notification/updateNotification/pending', (state: NotificationStateType) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase('notification/updateNotification/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notification: Notification }>) => {
        state.updateStatus = 'success';
        const updatedNotification = action.payload.notification;
        
        // Update in main notifications
        const index = state.notifications.findIndex(notification => notification.id === updatedNotification.id);
        if (index !== -1) {
          state.notifications[index] = updatedNotification;
        }
        
        // Update in unread notifications
        const unreadIndex = state.unreadNotifications.findIndex(notification => notification.id === updatedNotification.id);
        if (unreadIndex !== -1) {
          if (updatedNotification.is_read) {
            state.unreadNotifications.splice(unreadIndex, 1);
          } else {
            state.unreadNotifications[unreadIndex] = updatedNotification;
          }
        } else if (!updatedNotification.is_read) {
          // If it was read and now unread, add to unread
          state.unreadNotifications.unshift(updatedNotification);
        }
        
        // Update current notification
        if (state.currentNotification?.id === updatedNotification.id) {
          state.currentNotification = updatedNotification;
        }
        
        state.updateError = null;
      })
      .addCase('notification/updateNotification/rejected', (state: NotificationStateType, action: any) => {
        state.updateStatus = 'error';
        state.updateError = action.payload as string || 'Failed to update notification';
      });

    // Handle delete notification thunk
    builder
      .addCase('notification/deleteNotification/fulfilled', (state: NotificationStateType, action: PayloadAction<string>) => {
        const notificationId = action.payload;
        state.notifications = state.notifications.filter(notification => notification.id !== notificationId);
        state.unreadNotifications = state.unreadNotifications.filter(notification => notification.id !== notificationId);
        if (state.currentNotification?.id === notificationId) {
          state.currentNotification = null;
        }
      });

    // Handle mark as read thunk
    builder
      .addCase('notification/markAsRead/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notification_ids: string[] }>) => {
        const { notification_ids } = action.payload;
        const now = new Date().toISOString();
        
        // Update notifications
        notification_ids.forEach(id => {
          const index = state.notifications.findIndex(notification => notification.id === id);
          if (index !== -1) {
            state.notifications[index].is_read = true;
            state.notifications[index].read_at = now;
          }
        });
        
        // Remove from unread
        state.unreadNotifications = state.unreadNotifications.filter(notification => !notification_ids.includes(notification.id));
        
        // Update current notification
        if (state.currentNotification && notification_ids.includes(state.currentNotification.id)) {
          state.currentNotification.is_read = true;
          state.currentNotification.read_at = now;
        }
      });

    // Handle mark all as read thunk
    builder
      .addCase('notification/markAllAsRead/fulfilled', (state: NotificationStateType) => {
        const now = new Date().toISOString();
        
        // Mark all notifications as read
        state.notifications.forEach(notification => {
          if (!notification.is_read) {
            notification.is_read = true;
            notification.read_at = now;
          }
        });
        
        // Clear unread notifications
        state.unreadNotifications = [];
        
        // Update current notification
        if (state.currentNotification && !state.currentNotification.is_read) {
          state.currentNotification.is_read = true;
          state.currentNotification.read_at = now;
        }
      });

    // Handle bulk delete thunk
    builder
      .addCase('notification/bulkDelete/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notification_ids: string[] }>) => {
        const { notification_ids } = action.payload;
        state.notifications = state.notifications.filter(notification => !notification_ids.includes(notification.id));
        state.unreadNotifications = state.unreadNotifications.filter(notification => !notification_ids.includes(notification.id));
        if (state.currentNotification && notification_ids.includes(state.currentNotification.id)) {
          state.currentNotification = null;
        }
      });

    // Handle fetch unread notifications thunk
    builder
      .addCase('notification/fetchUnreadNotifications/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notifications: Notification[]; pagination: any }>) => {
        state.unreadNotifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
      });

    // Handle fetch notification settings thunk
    builder
      .addCase('notification/fetchNotificationSettings/fulfilled', (state: NotificationStateType, action: PayloadAction<{ settings: any }>) => {
        state.settings = action.payload.settings;
      });

    // Handle update notification settings thunk
    builder
      .addCase('notification/updateNotificationSettings/fulfilled', (state: NotificationStateType, action: PayloadAction<{ settings: any }>) => {
        state.settings = action.payload.settings;
      });

    // Handle fetch notification stats thunk
    builder
      .addCase('notification/fetchNotificationStats/fulfilled', (state: NotificationStateType, action: PayloadAction<{ stats: any }>) => {
        state.stats = action.payload.stats;
      });
  },
});

export const {
  clearError,
  clearCreateError,
  clearUpdateError,
  resetCreateStatus,
  resetUpdateStatus,
  setCurrentNotification,
  updateFilters,
  resetFilters,
  clearNotifications,
  updateNotificationLocal,
  removeNotificationLocal,
  addNotification,
  markAsReadLocal,
  markAllAsReadLocal,
  updateNotificationSettings,
  bulkRemoveNotifications,
  updateStats,
  incrementUnreadCount,
  decrementUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;
