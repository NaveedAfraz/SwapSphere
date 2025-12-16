import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { Interactions } from "@/src/constants/theme";
import {
  selectNotifications,
  selectNotificationStatus,
  selectNotificationError,
  selectUnreadCount,
  getNotificationTitle,
  getNotificationMessage,
  getNotificationIcon,
  getNotificationColor,
} from "@/src/features/notification/notificationSelectors";
import {
  fetchNotificationsThunk,
  markAsReadThunk,
} from "@/src/features/notification/notificationThunks";
import { updateNotificationLocal } from "@/src/features/notification/notificationSlice";
import { acceptOfferThunk } from "@/src/features/offer/offerThunks";
import { Notification } from "@/src/features/notification/types/notification";
import { useTheme } from "@/src/contexts/ThemeContext";
import { selectUser as selectAuthUser } from "@/src/features/auth/authSelectors";
import { PullToRefresh } from "@/src/components/PullToRefresh";

interface NotificationItemProps {
  notification: Notification;
  onExpand: (notification: Notification) => void;
  onMarkAsRead: (notification: Notification) => void;
  onAcceptOffer: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onExpand,
  onMarkAsRead,
  onAcceptOffer,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const currentUser = useSelector(selectAuthUser);
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useState(new Animated.Value(0))[0];
  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const iconColor = getNotificationColor(notification.type);
  const isUnread = !notification.is_read;

  const handleItemPress = () => {
    // Mark as read if needed (without navigation)
    if (isUnread) {
      onMarkAsRead(notification);
    }

    // Toggle expansion with animation
    setIsExpanded(!isExpanded);
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 0 : 50, // Height for action buttons
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getActionButtons = () => {
    const { type, payload } = notification;

    switch (type) {
      case "message_received":
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => onExpand(notification)}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={styles.actionButtonText}>Chat Now</Text>
            </TouchableOpacity>
          </View>
        );

      case "offer_received":
        // Check if offer is already accepted from notification status
        const isOfferAccepted = notification.status === "accepted";

        return (
          <View style={styles.actionButtons}>
            {!isOfferAccepted ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAcceptOffer(notification)}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={styles.actionButtonText}>Accept Offer</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptedButton]}
                onPress={() =>
                  router.push(
                    `/product/${
                      notification.payload?.listing_id ||
                      notification.payload?.product_id
                    }`
                  )
                }
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => {
                const actorId = notification.actor_id || notification.actor?.id;
                if (actorId) {
                  // Pass both user ID and listing ID to conversation screen
                  const listingId = notification.payload?.listing_id;
                  if (listingId) {
                    // Navigate with listingId and both participant IDs - let conversation screen find the chat
                    router.push(`/inbox/${actorId}?listingId=${listingId}&participant1Id=${currentUser?.id}&participant2Id=${actorId}`);
                  } else {
                    router.push(`/inbox/${actorId}`);
                  }
                } else {
                  router.push("/(tabs)/inbox");
                }
              }}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        );

      case "offer_accepted":
      case "offer_declined":
      case "offer_countered":
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptedButton]}
              onPress={() =>
                router.push(
                  `/product/${
                    notification.payload?.listing_id ||
                    notification.payload?.product_id
                  }`
                )
              }
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={() => {
                const actorId = notification.actor_id || notification.actor?.id;
                if (actorId) {
                  // Pass both user ID and listing ID to conversation screen
                  const listingId = notification.payload?.listing_id;
                  if (listingId) {
                    // Navigate with listingId and both participant IDs - let conversation screen find the chat
                    router.push(`/inbox/${actorId}?listingId=${listingId}&participant1Id=${currentUser?.id}&participant2Id=${actorId}`);
                  } else {
                    router.push(`/inbox/${actorId}`);
                  }
                } else {
                  router.push("/(tabs)/inbox");
                }
              }}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const handleAcceptOffer = (notif: Notification) => {
    // Handle accept offer logic
    onExpand(notif);
  };

  const handleDeclineOffer = (notif: Notification) => {
    // Handle decline offer logic
    onExpand(notif);
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        isUnread && styles.unreadItem,
        { backgroundColor: theme.theme.colors.surface },
      ]}
      onPress={handleItemPress}
      activeOpacity={Interactions.buttonOpacity}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}
      >
        <Ionicons
          name={getNotificationIcon(notification.type)}
          size={24}
          color={iconColor}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              isUnread && styles.unreadTitle,
              { color: theme.theme.colors.primary },
            ]}
          >
            {getNotificationTitle(notification)}
          </Text>
          <Text style={[styles.time, { color: theme.theme.colors.secondary }]}>
            {formatTime(notification.created_at)}
          </Text>
        </View>

        <Text
          style={[
            styles.body,
            isUnread && styles.unreadBody,
            { color: theme.theme.colors.secondary },
          ]}
        >
          {getNotificationMessage(notification)}
        </Text>

        {notification.actor?.profile?.name && (
          <Text
            style={[styles.actorName, { color: theme.theme.colors.secondary }]}
          >
            {notification.actor.profile.name}
          </Text>
        )}

        <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
          {getActionButtons()}
        </Animated.View>
      </View>

      {isUnread && (
        <View
          style={[
            styles.unreadDot,
            { backgroundColor: theme.theme.colors.error },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Redux state
  const notifications = useSelector(selectNotifications);
  const status = useSelector(selectNotificationStatus);
  const error = useSelector(selectNotificationError);
  const unreadCount = useSelector(selectUnreadCount);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotificationsThunk({}) as any);
  }, []); // Empty dependency array to only fetch once on mount

  const handleRefresh = () => {
    setRefreshing(true);
    dispatch(fetchNotificationsThunk({}) as any).finally(() => {
      setRefreshing(false);
    });
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    const promises = unreadNotifications.map((notification) =>
      dispatch(markAsReadThunk(notification.id) as any)
    );

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            // Clear all notifications logic here
            // This would typically dispatch a clear all thunk
            console.log("Clear all notifications");
          },
        },
      ]
    );
  };

  const handleNotificationPress = async (notification: Notification) => {
    // First mark as read if needed
    if (!notification.is_read) {
      await dispatch(markAsReadThunk(notification.id) as any);
    }
    
    // Then navigate based on notification type and payload
    const { type, payload } = notification;

    switch (type) {
      case "offer_received":
      case "offer_countered":
      case "offer_accepted":
      case "offer_declined":
      case "listing_favorited":
        if (payload?.listing_id) {
          router.push(`/listing/${payload.listing_id}` as any);
        } else {
          router.push("/inbox");
        }
        break;

      case "message_received":
        if (payload?.conversation_id) {
          router.push(`/inbox/${payload.conversation_id}` as any);
        } else {
          router.push("/inbox");
        }
        break;

      case "listing_sold":
      case "payment_received":
      case "review_received":
        if (payload?.order_id) {
          router.push(`/orders/${payload.order_id}` as any);
        } else {
          router.push("/profile");
        }
        break;

      case "system_update":
        if (payload?.action_url) {
          router.push(payload.action_url as any);
        } else {
          router.push("/profile");
        }
        break;

      default:
        router.push("/inbox");
        break;
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    // Only mark as read without navigation
    if (!notification.is_read) {
      await dispatch(markAsReadThunk(notification.id) as any);
    }
  };

  const handleAcceptOffer = async (notification: Notification) => {
    // Accept offer logic using offer thunk
    try {
      if (notification.payload?.offer_id) {
        const result = await dispatch(
          acceptOfferThunk(notification.payload.offer_id) as any
        );
        if (result.error) {
          console.error("Accept offer failed:", result.error);
        } else {
          console.log(
            "Offer accepted successfully:",
            notification.payload.offer_id
          );

          // Immediately update the local notification state
          dispatch(
            updateNotificationLocal({
              id: notification.id,
              updates: {
                status: "accepted",
                is_read: true,
              },
            } as any)
          );
        }
      } else {
        console.error("No offer_id found in notification payload");
      }
    } catch (error) {
      console.error("Failed to accept offer:", error);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onExpand={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
      onAcceptOffer={handleAcceptOffer}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={theme.theme.colors.secondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.theme.colors.primary }]}>
        No notifications
      </Text>
      <Text style={[styles.emptyBody, { color: theme.theme.colors.secondary }]}>
        You're all caught up! Check back later for new updates.
      </Text>
    </View>
  );

  if (status === "loading" && notifications.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { paddingBottom: insets.bottom, paddingTop: insets.top },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.theme.colors.accent} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.theme.colors.secondary },
            ]}
          >
            Loading notifications...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      <View
        style={[styles.header, { backgroundColor: theme.theme.colors.surface }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.theme.colors.primary}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.theme.colors.primary }]}
        >
          Notifications
        </Text>
        <View style={styles.headerRight}>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAllNotifications}
              style={styles.clearButton}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.theme.colors.error}
              />
            </TouchableOpacity>
          )}
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              style={styles.markAllButton}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text
                style={[
                  styles.markAllButtonText,
                  { color: theme.theme.colors.accent },
                ]}
              >
                Mark All Read
              </Text>
            </TouchableOpacity>
          )}
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: theme.theme.colors.error },
              ]}
            >
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyContent : styles.listContent
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </PullToRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllButton: {
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllButtonText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  chatButton: {
    backgroundColor: "#3B82F6",
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  acceptedButton: {
    backgroundColor: "#6B7280",
  },
  declineButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContent: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: "#1E40AF",
  },
  time: {
    fontSize: 12,
    color: "#6B7280",
  },
  body: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  unreadBody: {
    color: "#374151",
  },
  actorName: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3B82F6",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  emptyBody: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
});
