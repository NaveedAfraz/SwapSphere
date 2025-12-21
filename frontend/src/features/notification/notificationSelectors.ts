import type { RootState } from '../../store';
import type { NotificationStateType, Notification, NotificationType, NotificationPriority } from './types/notification';

// Import Ionicons for type checking
import { Ionicons } from '@expo/vector-icons';

// Essential selectors used in notifications screen
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

export const selectUnreadCount = (state: RootState): number => 
  selectUnreadNotifications(state).length;

// Essential derived selectors
export const selectIsNotificationLoading = (state: RootState): boolean => 
  selectNotificationStatus(state) === 'loading';

export const selectIsNotificationError = (state: RootState): boolean => 
  selectNotificationStatus(state) === 'error';

export const selectIsNotificationSuccess = (state: RootState): boolean => 
  selectNotificationStatus(state) === 'success';

// Essential notification-specific selectors
export const selectNotificationById = (state: RootState, notificationId: string): Notification | undefined => 
  selectNotifications(state).find(notification => notification.id === notificationId);

// Database-specific selectors
export const selectNotificationsByType = (state: RootState, type: NotificationType): Notification[] => 
  selectNotifications(state).filter(notification => notification.type === type);

export const selectNotificationsByActor = (state: RootState, actorId: string): Notification[] => 
  selectNotifications(state).filter(notification => notification.actor_id === actorId);

export const selectUnreadNotificationsByType = (state: RootState, type: NotificationType): Notification[] => 
  selectUnreadNotifications(state).filter(notification => notification.type === type);

export const selectRecentNotifications = (state: RootState, limit: number = 10): Notification[] => 
  selectNotifications(state)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

export const selectNotificationsByDateRange = (state: RootState, startDate: string, endDate: string): Notification[] => 
  selectNotifications(state).filter(notification => {
    const notificationDate = new Date(notification.created_at);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return notificationDate >= start && notificationDate <= end;
  });

// Essential priority-based selectors (using payload)
export const selectNotificationsByPriority = (state: RootState, priority: NotificationPriority): Notification[] => 
  selectNotifications(state).filter(notification => {
    return notification.payload?.priority === priority;
  });

export const selectUnreadNotificationsByPriority = (state: RootState, priority: NotificationPriority): Notification[] => 
  selectUnreadNotifications(state).filter(notification => {
    return notification.payload?.priority === priority;
  });

export const selectReadNotifications = (state: RootState): Notification[] => 
  selectNotifications(state).filter(notification => notification.is_read);

// Essential type-based selectors for database notification types
export const selectMessageNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'message_received');

export const selectOfferNotifications = (state: RootState): Notification[] => 
  selectNotifications(state).filter(notification => 
    notification.type === 'offer_received' || 
    notification.type === 'offer_countered' || 
    notification.type === 'offer_accepted' || 
    notification.type === 'offer_declined'
  );

export const selectPaymentNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'payment_received');

export const selectReviewNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'review_received');

export const selectListingNotifications = (state: RootState): Notification[] => 
  selectNotifications(state).filter(notification => 
    notification.type === 'listing_favorited' || 
    notification.type === 'listing_sold'
  );

export const selectSystemNotifications = (state: RootState): Notification[] => 
  selectNotificationsByType(state, 'system_update');

// Essential priority-based selectors
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

// Essential complex selectors
export const selectNotificationsNeedingAction = (state: RootState): Notification[] => 
  selectUnreadNotifications(state).filter(notification => 
    notification.payload?.action_url && 
    (notification.payload?.priority === 'urgent' || notification.payload?.priority === 'high')
  );

export const selectCriticalNotifications = (state: RootState): Notification[] => 
  selectUnreadNotifications(state).filter(notification => 
    notification.payload?.priority === 'urgent' && 
    (notification.payload?.category === 'alert' || notification.type === 'system_update')
  );

// Notification payload helpers for database structure
export const getNotificationTitle = (notification: Notification): string => {
  const { type, payload } = notification;
  
  switch (type) {
    case 'intent_match':
      if (payload?.counter_offered || notification.status === 'offer_countered') {
        return `Counter offer on ${payload?.listing_title || 'your listing'}`;
      }
      return `New buyer interested in ${payload?.listing_title || 'your listing'}`;
    case 'offer_received':
      return `New offer on ${payload?.listing_title || 'your listing'}`;
    case 'offer_countered':
      return `Counter offer on ${payload?.listing_title || 'your listing'}`;
    case 'offer_accepted':
      return `Offer accepted on ${payload?.listing_title || 'your listing'}`;
    case 'offer_declined':
      return `Offer declined on ${payload?.listing_title || 'your listing'}`;
    case 'message_received':
      return `New message from ${payload?.sender_name || 'someone'}`;
    case 'listing_favorited':
      return `${payload?.user_name || 'Someone'} favorited your listing`;
    case 'listing_sold':
      return `Your listing ${payload?.listing_title || ''} has been sold`;
    case 'payment_received':
      return `Payment received for ${payload?.order_id || 'your order'}`;
    case 'review_received':
      return `New review from ${payload?.reviewer_name || 'someone'}`;
    case 'system_update':
      return payload?.title || 'System update';
    default:
      return 'New notification';
  }
};

export const getNotificationMessage = (notification: Notification): string => {
  const { type, payload } = notification;
  
  switch (type) {
    case 'intent_match':
      if (payload?.counter_offered || notification.status === 'offer_countered') {
        return `Seller countered with offer`;
      }
      return `Buyer wants: ${payload?.intent_title || 'your item'} (Budget: $${payload?.buyer_max_price || 0})`;
    case 'offer_received':
      return `$${payload?.offered_price || 0} for ${payload?.offered_quantity || 1} item(s)`;
    case 'offer_countered':
      return `$${payload?.offered_price || 0} counter offer`;
    case 'offer_accepted':
      return `Your offer of $${payload?.offered_price || 0} was accepted`;
    case 'offer_declined':
      return `Your offer of $${payload?.offered_price || 0} was declined`;
    case 'message_received':
      return payload?.message_preview || 'Tap to read message';
    case 'listing_favorited':
      return payload?.listing_title || 'Your listing';
    case 'listing_sold':
      return `Sold for $${payload?.sale_price || 0}`;
    case 'payment_received':
      return `$${payload?.amount || 0} payment received`;
    case 'review_received':
      return payload?.review_text || 'Tap to read review';
    case 'system_update':
      return payload?.message || 'System notification';
    default:
      return 'Tap to view details';
  }
};

export const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'intent_match':
      return 'search-outline';
    case 'offer_received':
      return 'cash-outline';
    case 'offer_countered':
      return 'sync-outline';
    case 'offer_accepted':
      return 'checkmark-circle-outline';
    case 'offer_declined':
      return 'close-circle-outline';
    case 'message_received':
      return 'chatbubble-outline';
    case 'listing_favorited':
      return 'heart-outline';
    case 'listing_sold':
      return 'bag-check-outline';
    case 'payment_received':
      return 'card-outline';
    case 'review_received':
      return 'star-outline';
    case 'system_update':
      return 'information-circle-outline';
    default:
      return 'notifications-outline';
  }
};

export const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case 'intent_match':
      return '#8B5CF6';
    case 'offer_received':
      return '#3B82F6';
    case 'offer_countered':
      return '#F59E0B';
    case 'offer_accepted':
      return '#10B981';
    case 'offer_declined':
      return '#DC2626';
    case 'message_received':
      return '#8B5CF6';
    case 'listing_favorited':
      return '#EC4899';
    case 'listing_sold':
      return '#10B981';
    case 'payment_received':
      return '#10B981';
    case 'review_received':
      return '#F59E0B';
    case 'system_update':
      return '#6B7280';
    default:
      return '#6B7280';
  }
};
