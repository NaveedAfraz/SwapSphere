import type { RootState } from '../../store';
import type { NotificationStateType, Notification, NotificationType, NotificationPriority } from './types/notification';

// Basic selectors
export const selectNotificationState = (state: RootState): NotificationStateType => state.notification;

export const selectNotifications = (state: RootState): Notification[] => 
  selectNotificationState(state).notifications;

export const selectUnreadNotifications = (state: RootState): Notification[] => 
  selectNotificationState(state).unreadNotifications;

export const selectCurrentNotification = (state: RootState): Notification | null => 
  selectNotificationState(state).currentNotification;

export const selectNotificationStatus = (state: RootState): string => 
  selectNotificationState(state).status;

export const selectNotificationError = (state: RootState): string | null => 
  selectNotificationState(state).error;

export const selectCreateStatus = (state: RootState): string => 
  selectNotificationState(state).createStatus;

export const selectCreateError = (state: RootState): string | null => 
  selectNotificationState(state).createError;

export const selectUpdateStatus = (state: RootState): string => 
  selectNotificationState(state).updateStatus;

export const selectUpdateError = (state: RootState): string | null => 
  selectNotificationState(state).updateError;

export const selectNotificationPagination = (state: RootState) => 
  selectNotificationState(state).pagination;

export const selectNotificationFilters = (state: RootState) => 
  selectNotificationState(state).filters;

export const selectNotificationSettings = (state: RootState) => 
  selectNotificationState(state).settings;

export const selectNotificationStats = (state: RootState) => 
  selectNotificationState(state).stats;

// Derived selectors
export const selectIsNotificationLoading = (state: RootState): boolean => 
  selectNotificationStatus(state) === 'loading';

export const selectIsNotificationError = (state: RootState): boolean => 
  selectNotificationStatus(state) === 'error';

export const selectIsNotificationSuccess = (state: RootState): boolean => 
  selectNotificationStatus(state) === 'success';

export const selectIsCreateNotificationLoading = (state: RootState): boolean => 
  selectCreateStatus(state) === 'loading';

export const selectIsCreateNotificationError = (state: RootState): boolean => 
  selectCreateStatus(state) === 'error';

export const selectIsCreateNotificationSuccess = (state: RootState): boolean => 
  selectCreateStatus(state) === 'success';

export const selectIsUpdateNotificationLoading = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'loading';

export const selectIsUpdateNotificationError = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'error';

export const selectIsUpdateNotificationSuccess = (state: RootState): boolean => 
  selectUpdateStatus(state) === 'success';

export const selectHasMoreNotifications = (state: RootState): boolean => 
  selectNotificationPagination(state).hasMore;

export const selectTotalNotifications = (state: RootState): number => 
  selectNotificationPagination(state).total;

export const selectUnreadCount = (state: RootState): number => 
  selectNotificationStats(state).unread_count;

export const selectReadCount = (state: RootState): number => 
  selectNotificationStats(state).read_count;

// Notification-specific selectors
export const selectNotificationById = (state: RootState, notificationId: string): Notification | undefined => 
  selectNotifications(state).find(notification => notification.id === notificationId);

export const selectUnreadNotificationById = (state: RootState, notificationId: string): Notification | undefined => 
  selectUnreadNotifications(state).find(notification => notification.id === notificationId);

export const selectNotificationsByType = (state: RootState, type: NotificationType): Notification[] => 
  selectNotifications(state).filter(notification => notification.type === type);

export const selectUnreadNotificationsByType = (state: RootState, type: NotificationType): Notification[] => 
  selectUnreadNotifications(state).filter(notification => notification.type === type);

export const selectNotificationsByPriority = (state: RootState, priority: NotificationPriority): Notification[] => 
  selectNotifications(state).filter(notification => notification.priority === priority);

export const selectUnreadNotificationsByPriority = (state: RootState, priority: NotificationPriority): Notification[] => 
  selectUnreadNotifications(state).filter(notification => notification.priority === priority);

export const selectReadNotifications = (state: RootState): Notification[] => 
  selectNotifications(state).filter(notification => notification.is_read);

export const selectExpiredNotifications = (state: RootState): Notification[] => {
  const now = new Date();
  return selectNotifications(state).filter(notification => 
    notification.expires_at && new Date(notification.expires_at) < now
  );
};

export const selectNotificationsWithAction = (state: RootState): Notification[] => 
  selectNotifications(state).filter(notification => notification.action_url);

export const selectUnreadNotificationsWithAction = (state: RootState): Notification[] => 
  selectUnreadNotifications(state).filter(notification => notification.action_url);

// Type-based selectors
export const selectMessageNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'message');

export const selectOfferNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'offer');

export const selectOrderNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'order');

export const selectPaymentNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'payment');

export const selectReviewNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'review');

export const selectListingNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'listing');

export const selectSystemNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'system');

export const selectPromotionNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'promotion');

export const selectReminderNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'reminder');

export const selectAlertNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'alert');

// Priority-based selectors
export const selectUrgentNotifications = (state: RootState): Notification[] => 
  selectNotificationsByPriority(state, 'urgent');

export const selectHighPriorityNotifications = (state: RootState): Notification[] => 
  selectNotificationsByPriority(state, 'high');

export const selectMediumPriorityNotifications = (state: RootState): Notification[] => 
  selectNotificationsByPriority(state, 'medium');

export const selectLowPriorityNotifications = (state: RootState): Notification[] => 
  selectNotificationsByPriority(state, 'low');

export const selectUnreadUrgentNotifications = (state: RootState): Notification[] => 
  selectUnreadNotificationsByPriority(state, 'urgent');

export const selectUnreadHighPriorityNotifications = (state: RootState): Notification[] => 
  selectUnreadNotificationsByPriority(state, 'high');

export const selectUnreadMediumPriorityNotifications = (state: RootState): Notification[] => 
  selectUnreadNotificationsByPriority(state, 'medium');

export const selectUnreadLowPriorityNotifications = (state: RootState): Notification[] => 
  selectUnreadNotificationsByPriority(state, 'low');

// Settings selectors
export const selectPushEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).push_enabled;

export const selectEmailEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).email_enabled;

export const selectMessageNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).message_notifications;

export const selectOfferNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).offer_notifications;

export const selectOrderNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).order_notifications;

export const selectPaymentNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).payment_notifications;

export const selectReviewNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).review_notifications;

export const selectListingNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).listing_notifications;

export const selectSystemNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).system_notifications;

export const selectPromotionNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).promotion_notifications;

export const selectReminderNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).reminder_notifications;

export const selectAlertNotificationsEnabled = (state: RootState): boolean => 
  selectNotificationSettings(state).alert_notifications;

// Time-based selectors
export const selectRecentNotifications = (state: RootState, hours: number = 24): Notification[] => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  return selectNotifications(state).filter(notification => 
    new Date(notification.created_at) >= cutoffDate
  );
};

export const selectRecentUnreadNotifications = (state: RootState, hours: number = 24): Notification[] => {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  return selectUnreadNotifications(state).filter(notification => 
    new Date(notification.created_at) >= cutoffDate
  );
};

export const selectOldNotifications = (state: RootState, days: number = 7): Notification[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectNotifications(state).filter(notification => 
    new Date(notification.created_at) < cutoffDate
  );
};

export const selectOldUnreadNotifications = (state: RootState, days: number = 7): Notification[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return selectUnreadNotifications(state).filter(notification => 
    new Date(notification.created_at) < cutoffDate
  );
};

// Complex selectors
export const selectNotificationsNeedingAction = (state: RootState): Notification[] => 
  selectUnreadNotifications(state).filter(notification => 
    notification.action_url && 
    (notification.priority === 'urgent' || notification.priority === 'high')
  );

export const selectCriticalNotifications = (state: RootState): Notification[] => 
  selectUnreadNotifications(state).filter(notification => 
    notification.priority === 'urgent' && 
    (notification.type === 'alert' || notification.type === 'system')
  );

export const selectNotificationSummary = (state: RootState) => {
  const unread = selectUnreadNotifications(state);
  const urgent = selectUnreadUrgentNotifications(state);
  const high = selectUnreadHighPriorityNotifications(state);
  const needingAction = selectNotificationsNeedingAction(state);
  
  return {
    totalUnread: unread.length,
    urgentCount: urgent.length,
    highPriorityCount: high.length,
    needingActionCount: needingAction.length,
    hasCritical: urgent.some(n => n.type === 'alert' || n.type === 'system'),
    oldestUnread: unread.length > 0 ? unread[unread.length - 1].created_at : null,
    newestUnread: unread.length > 0 ? unread[0].created_at : null,
  };
};

export const selectNotificationTypeStats = (state: RootState) => {
  const notifications = selectNotifications(state);
  const stats: Record<NotificationType, { total: number; unread: number; read: number }> = {
    message: { total: 0, unread: 0, read: 0 },
    offer: { total: 0, unread: 0, read: 0 },
    order: { total: 0, unread: 0, read: 0 },
    payment: { total: 0, unread: 0, read: 0 },
    review: { total: 0, unread: 0, read: 0 },
    listing: { total: 0, unread: 0, read: 0 },
    system: { total: 0, unread: 0, read: 0 },
    promotion: { total: 0, unread: 0, read: 0 },
    reminder: { total: 0, unread: 0, read: 0 },
    alert: { total: 0, unread: 0, read: 0 },
  };
  
  notifications.forEach(notification => {
    stats[notification.type].total++;
    if (notification.is_read) {
      stats[notification.type].read++;
    } else {
      stats[notification.type].unread++;
    }
  });
  
  return stats;
};

export const selectNotificationPriorityStats = (state: RootState) => {
  const notifications = selectNotifications(state);
  const stats: Record<NotificationPriority, { total: number; unread: number; read: number }> = {
    low: { total: 0, unread: 0, read: 0 },
    medium: { total: 0, unread: 0, read: 0 },
    high: { total: 0, unread: 0, read: 0 },
    urgent: { total: 0, unread: 0, read: 0 },
  };
  
  notifications.forEach(notification => {
    stats[notification.priority].total++;
    if (notification.is_read) {
      stats[notification.priority].read++;
    } else {
      stats[notification.priority].unread++;
    }
  });
  
  return stats;
};

export const selectNotificationHealthScore = (state: RootState): number => {
  const stats = selectNotificationStats(state);
  const total = stats.total_notifications;
  if (total === 0) return 100;
  
  const readRate = (stats.read_count / total) * 100;
  const expiredRate = (stats.expired_count / total) * 100;
  
  // Health score considers read rate and penalizes expired notifications
  return Math.max(0, Math.min(100, readRate - (expiredRate * 2)));
};

export const selectNotificationEngagementRate = (state: RootState): number => {
  const stats = selectNotificationStats(state);
  const total = stats.total_notifications;
  if (total === 0) return 0;
  
  return (stats.read_count / total) * 100;
};

export const selectNotificationResponseTime = (state: RootState): number | null => {
  const readNotifications = selectReadNotifications(state);
  const notificationsWithReadTime = readNotifications.filter(n => n.read_at);
  
  if (notificationsWithReadTime.length === 0) return null;
  
  const totalResponseTime = notificationsWithReadTime.reduce((total, notification) => {
    const created = new Date(notification.created_at);
    const read = new Date(notification.read_at!);
    return total + (read.getTime() - created.getTime());
  }, 0);
  
  return totalResponseTime / notificationsWithReadTime.length / (1000 * 60); // in minutes
};
