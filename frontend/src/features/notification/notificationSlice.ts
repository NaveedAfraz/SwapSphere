import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NotificationStateType, Notification, NotificationType, NotificationPriority } from './types/notification';

const initialState: NotificationStateType = {
  notifications: [],
  unreadNotifications: [],
  currentNotification: null,
  status: 'idle',
  error: null,
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
  // Removed unused settings, stats, and other complex states
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Essential synchronous actions only
    clearError: (state: NotificationStateType) => {
      state.error = null;
    },
    setCurrentNotification: (state: NotificationStateType, action: PayloadAction<Notification | null>) => {
      state.currentNotification = action.payload;
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
    markAsReadLocal: (state: NotificationStateType, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      
      // Update in main notifications
      const index = state.notifications.findIndex(notification => notification.id === notificationId);
      if (index !== -1) {
        state.notifications[index].is_read = true;
      }
      
      // Remove from unread notifications
      state.unreadNotifications = state.unreadNotifications.filter(notification => notification.id !== notificationId);
      
      // Update current notification
      if (state.currentNotification?.id === notificationId) {
        state.currentNotification.is_read = true;
      }
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

    // Handle mark as read thunk
    builder
      .addCase('notification/markAsRead/fulfilled', (state: NotificationStateType, action: PayloadAction<{ notification_ids: string[] }>) => {
        const { notification_ids } = action.payload;
        
        // Update notifications
        notification_ids.forEach(id => {
          const index = state.notifications.findIndex(notification => notification.id === id);
          if (index !== -1) {
            state.notifications[index].is_read = true;
          }
        });
        
        // Remove from unread
        state.unreadNotifications = state.unreadNotifications.filter(notification => !notification_ids.includes(notification.id));
        
        // Update current notification
        if (state.currentNotification && notification_ids.includes(state.currentNotification.id)) {
          state.currentNotification.is_read = true;
        }
      });

    // Handle mark all as read thunk
    builder
      .addCase('notification/markAllAsRead/fulfilled', (state: NotificationStateType) => {
        // Mark all notifications as read
        state.notifications.forEach(notification => {
          notification.is_read = true;
        });
        
        // Clear unread notifications
        state.unreadNotifications = [];
        
        // Update current notification
        if (state.currentNotification) {
          state.currentNotification.is_read = true;
        }
      });
  },
});

export const {
  clearError,
  setCurrentNotification,
  clearNotifications,
  updateNotificationLocal,
  markAsReadLocal,
} = notificationSlice.actions;

export default notificationSlice.reducer;
