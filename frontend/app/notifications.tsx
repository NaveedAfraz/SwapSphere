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
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
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
  updateNotificationThunk,
} from "@/src/features/notification/notificationThunks";
import { updateNotificationLocal } from "@/src/features/notification/notificationSlice";
import { acceptOfferThunk } from "@/src/features/offer/offerThunks";
import { createOfferThunk } from "@/src/features/offer/offerThunks";
import { findOrCreateDealRoomThunk } from "@/src/features/dealRooms/dealRoomThunks";
import {
  selectCreateStatus,
  selectCreateError,
} from "@/src/features/offer/offerSelectors";
import { resetCreateStatus } from "@/src/features/offer/offerSlice";
import { Notification } from "@/src/features/notification/types/notification";
import { apiClient } from "@/src/services/api";

import {
  selectUser as selectAuthUser,
  selectUser,
} from "@/src/features/auth/authSelectors";
import { PullToRefresh } from "@/src/components/PullToRefresh";
import OfferModal from "@/src/components/OfferModal";
import { useAppSelector } from "@/src/hooks/redux";
import {
  getCurrentUser,
  getAuthState,
  isAuthenticated,
} from "@/src/services/authService";

interface NotificationItemProps {
  notification: Notification;
  onExpand: (notification: Notification) => void;
  onMarkAsRead: (notification: Notification) => void;
  onAcceptOffer: (notification: Notification) => void;
  onMakeOffer: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onExpand,
  onMarkAsRead,
  onAcceptOffer,
  onMakeOffer,
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
      case "intent_match":
        // Check if an offer has already been made for this intent/listing pair
        const hasOfferMade =
          notification.payload?.offer_made ||
          notification.status === "offer_created";

        // Check if there's a counter offer
        const hasCounterOffer =
          notification.payload?.counter_offered ||
          notification.status === "offer_countered" ||
          notification.type === "offer_countered";

        // Check if current user is the seller
        const isSeller = notification.user_id === currentUser?.id;
        const isBuyer = notification.actor_id === currentUser?.id;

        return (
          <View style={styles.actionButtons}>
            {!hasOfferMade && !hasCounterOffer ? (
              isSeller ? (
                // Seller can respond to intent with counter offer
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.acceptButton,
                    { backgroundColor: theme.theme.colors.accent },
                  ]}
                  onPress={() => {
                    // Open offer modal for seller to make counter offer
                    onMakeOffer(notification);
                  }}
                  activeOpacity={Interactions.buttonOpacity}
                >
                  <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                    Respond to Intent
                  </Text>
                </TouchableOpacity>
              ) : (
                // Buyer can make offer
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.acceptButton,
                    { backgroundColor: theme.theme.colors.accent },
                  ]}
                  onPress={() => {
                    // Open offer modal instead of navigating
                    onMakeOffer(notification);
                  }}
                  activeOpacity={Interactions.buttonOpacity}
                >
                  <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                    Make Offer
                  </Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.acceptedButton,
                  { backgroundColor: theme.theme.colors.secondary },
                ]}
                onPress={() => {
                  console.log('=== VIEW COUNTER OFFER BUTTON CLICKED ===');
                  console.log('hasCounterOffer:', hasCounterOffer);
                  console.log('notification.payload:', notification.payload);
                  
                  const actorId = notification.actor_id || notification.actor?.id;
                  const listingId = notification.payload?.listing_id;
                  const dealRoomId = notification.payload?.deal_room_id;
                  
                  if (dealRoomId) {
                    console.log('Navigating to deal room:', dealRoomId);
                    router.push(`/deal-room/${dealRoomId}?listingId=${listingId}&participant1Id=${currentUser?.id}&participant2Id=${actorId}`);
                  } else {
                    console.log('No dealRoomId, falling back to inbox');
                    router.push("/(tabs)/inbox");
                  }
                }}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                  {hasCounterOffer ? "View Counter Offer" : "Chat"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case "message_received":
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.chatButton,
                { backgroundColor: theme.theme.colors.primary },
              ]}
              onPress={() => {
                  console.log('=== BUTTON CLICK DEBUG ===');
                  console.log('View Counter Offer button clicked');
                  onExpand(notification);
                }}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                Chat Now
              </Text>
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
                style={[
                  styles.actionButton,
                  styles.acceptButton,
                  { backgroundColor: theme.theme.colors.accent },
                ]}
                onPress={() => onAcceptOffer(notification)}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                  Accept Offer
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.acceptedButton,
                  { backgroundColor: theme.theme.colors.secondary },
                ]}
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
                <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                  View Details
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.chatButton,
                { backgroundColor: theme.theme.colors.primary },
              ]}
              onPress={() => {
                const actorId = notification.actor_id || notification.actor?.id;
                const dealRoomId = notification.payload?.deal_room_id;
                
                console.log('=== NOTIFICATION NAVIGATION DEBUG ===');
                console.log('notification.type:', notification.type);
                console.log('notification.status:', notification.status);
                console.log('notification.payload:', notification.payload);
                console.log('actorId:', actorId);
                console.log('dealRoomId:', dealRoomId);
                
                if (dealRoomId) {
                  // Use actual deal room ID if available
                  console.log('Navigating to deal room:', dealRoomId);
                  router.push(`/deal-room/${dealRoomId}` as any);
                } else if (actorId) {
                  // Fallback: Pass both user ID and listing ID to conversation screen
                  const listingId = notification.payload?.listing_id;
                  console.log('No deal_room_id found, using actorId fallback:', actorId);
                  if (listingId) {
                    // Navigate with listingId and both participant IDs - let conversation screen find the chat
                    router.push(
                      `/deal-room/${actorId}?listingId=${listingId}&participant1Id=${currentUser?.id}&participant2Id=${actorId}` as any
                    );
                  } else {
                    router.push(`/deal-room/${actorId}` as any);
                  }
                } else {
                  console.log('No actorId found, going to inbox');
                  router.push("/(tabs)/inbox");
                }
              }}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        );

      // case "offer_accepted":
      case "offer_declined":
      case "offer_countered":
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.theme.colors.primary },
              ]}
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
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                View Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.theme.colors.primary },
              ]}
              onPress={() => {
                const actorId = notification.actor_id || notification.actor?.id;
                const dealRoomId = notification.payload?.deal_room_id;
                
                console.log('=== NOTIFICATION NAVIGATION DEBUG ===');
                console.log('notification.type:', notification.type);
                console.log('notification.status:', notification.status);
                console.log('notification.payload:', notification.payload);
                console.log('actorId:', actorId);
                console.log('dealRoomId:', dealRoomId);
                
                if (dealRoomId) {
                  // Use actual deal room ID if available
                  console.log('Navigating to deal room:', dealRoomId);
                  router.push(`/deal-room/${dealRoomId}` as any);
                } else if (actorId) {
                  // Fallback: Pass both user ID and listing ID to conversation screen
                  const listingId = notification.payload?.listing_id;
                  console.log('No deal_room_id found, using actorId fallback:', actorId);
                  if (listingId) {
                    // Navigate with listingId and both participant IDs - let conversation screen find the chat
                    router.push(
                      `/deal-room/${actorId}?listingId=${listingId}&participant1Id=${currentUser?.id}&participant2Id=${actorId}` as any
                    );
                  } else {
                    router.push(`/deal-room/${actorId}` as any);
                  }
                } else {
                  console.log('No actorId found, going to inbox');
                  router.push("/(tabs)/inbox");
                }
              }}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                Chat
              </Text>
            </TouchableOpacity>
          </View>
        );

      case "offer_accepted":
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.acceptedButton,
                { backgroundColor: theme.theme.colors.secondary },
              ]}
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
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                View Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.theme.colors.primary },
              ]}
              onPress={() => {
                const actorId = notification.actor_id || notification.actor?.id;
                const dealRoomId = notification.payload?.deal_room_id;
                
                console.log('=== NOTIFICATION NAVIGATION DEBUG ===');
                console.log('notification.type:', notification.type);
                console.log('notification.status:', notification.status);
                console.log('notification.payload:', notification.payload);
                console.log('actorId:', actorId);
                console.log('dealRoomId:', dealRoomId);
                
                if (dealRoomId) {
                  // Use actual deal room ID if available
                  console.log('Navigating to deal room:', dealRoomId);
                  router.push(`/deal-room/${dealRoomId}` as any);
                } else if (actorId) {
                  // Fallback: Pass both user ID and listing ID to conversation screen
                  const listingId = notification.payload?.listing_id;
                  console.log('No deal_room_id found, using actorId fallback:', actorId);
                  if (listingId) {
                    // Navigate with listingId and both participant IDs - let conversation screen find the chat
                    router.push(
                      `/deal-room/${actorId}?listingId=${listingId}&participant1Id=${currentUser?.id}&participant2Id=${actorId}` as any
                    );
                  } else {
                    router.push(`/deal-room/${actorId}` as any);
                  }
                } else {
                  console.log('No actorId found, going to inbox');
                  router.push("/(tabs)/inbox");
                }
              }}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
                Chat
              </Text>
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
  const isCreatingOffer = useSelector(selectCreateStatus) === "loading";
  const currentUser = useAppSelector(selectUser);

  // Use unified auth service for user data
  // Prefer user with valid ID, fallback to JWT parsing
  const parsedUser = getCurrentUser();
  const activeUser = (currentUser && currentUser.id) ? currentUser : parsedUser;
  
  // Debug logging to understand the issue
  console.log('=== NOTIFICATIONS AUTH DEBUG ===');
  console.log('currentUser:', currentUser);
  console.log('getCurrentUser():', getCurrentUser());
  console.log('activeUser:', activeUser);
  console.log('isAuthenticated():', isAuthenticated());

  // Show loading state if user data is not available yet
  if (!activeUser?.id) {
    console.log('No active user found, showing loading...');
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 16, color: "#6B7280" }}>Loading...</Text>
      </View>
    );
  }

  const currentUserId = activeUser.id;

  const [refreshing, setRefreshing] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [sellerName, setSellerName] = useState<string>("");
  const [loadingSeller, setLoadingSeller] = useState<boolean>(false);
  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (isAuthenticated()) {
      dispatch(fetchNotificationsThunk({}) as any);
    }
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
      case "intent_match":
        console.log('=== NOTIFICATION NAVIGATION DEBUG ===');
        console.log('notification.type:', type);
        console.log('notification.status:', notification.status);
        console.log('notification.payload:', payload);
        console.log('payload?.counter_offered:', payload?.counter_offered);
        console.log('payload?.deal_room_id:', payload?.deal_room_id);
        
        // For intent_match notifications with counter offers, navigate to deal room
        if (payload?.counter_offered || notification.status === 'offer_countered') {
          // Navigate to deal room using deal_room_id from notification payload
          if (payload?.deal_room_id) {
            console.log('Navigating to deal room:', payload.deal_room_id);
            router.push(`/deal-room/${payload.deal_room_id}` as any);
          } else {

            // Try to find deal room using intent_id and listing_id
            if (payload?.intent_id && payload?.listing_id) {
              // Navigate to inbox for now, but we could implement deal room lookup here
              console.log('Would look up deal room for intent:', payload.intent_id, 'listing:', payload.listing_id);
              router.push("/inbox");
            } else {
              console.log('No intent_id or listing_id, falling back to inbox');
              router.push("/inbox");
            }
          }
        } else {
          // For fresh intents, navigate to listing
          if (payload?.listing_id) {
            router.push(`/listing/${payload.listing_id}` as any);
          } else {
            router.push("/inbox");
          }
        }
        break;

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
          router.push(`/deal-room/${payload.conversation_id}` as any);
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

  const fetchSellerName = async (sellerId: string) => {
    if (!sellerId || sellerId === currentUserId) {
      setSellerName(activeUser?.profile?.name || "You");
      return;
    }

    setLoadingSeller(true);
    try {
      // Fetch user details by ID
      const response = await apiClient.get(`/user/${sellerId}`);
      setSellerName(response.data.name || "Seller");
    } catch (error) {
      console.log("Failed to fetch seller name:", error);
      setSellerName("Seller");
    } finally {
      setLoadingSeller(false);
    }
  };

  const handleMakeOffer = (notification: Notification) => {
    // Debug logging to check the values
    console.log("=== OFFER DEBUG ===");
    console.log("activeUser?.id:", activeUser?.id);
    console.log("currentUserId:", currentUserId);
    console.log("activeUser:", activeUser);
    console.log("notification.type:", notification.type);
    console.log("notification.user_id:", notification.user_id);
    console.log("notification.actor_id:", notification.actor_id);
    console.log("notification:", notification);
    
    // For intent_match notifications, check if current user is the seller
    if (notification.type === "intent_match") {
      const isSeller = notification.user_id === currentUserId;
      const isBuyer = notification.actor_id === currentUserId;
      console.log("isSeller comparison result:", isSeller);
      console.log("isBuyer comparison result:", isBuyer);
      console.log("notification.user_id === currentUserId:", notification.user_id, "===", currentUserId);

      // Allow sellers to respond to intents (this is a counter-offer, not an offer on their own listing)
      // Allow buyers to make offers on intents
      // Both can proceed
      if (isSeller) {
        console.log("Seller responding to intent - allowing counter-offer");
      } else if (isBuyer) {
        console.log("Buyer making offer on intent - allowing");
      } else {
        // This shouldn't happen, but just in case
        Alert.alert(
          "Cannot Make Offer",
          "You are not authorized to respond to this intent.",
          [{ text: "OK" }]
        );
        return;
      }
    } else {
      // For other notification types, check if user is trying to make offer on their own listing
      if (notification.user_id === currentUserId) {
        Alert.alert(
          "Cannot Make Offer",
          "You cannot make an offer on your own listing.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    
    setSelectedNotification(notification);
    
    // For other notification types, fetch seller name as before
    if (notification.user_id) {
      fetchSellerName(notification.user_id);
    }
    
    setShowOfferModal(true);
    dispatch(resetCreateStatus());

    // Debug log to check notification data
    console.log("handleMakeOffer notification:", {
      type: notification.type,
      listing_price: notification.payload?.listing_price,
      buyer_max_price: notification.payload?.buyer_max_price,
      listing_title: notification.payload?.listing_title,
      actor_name: notification.actor_name,
      actor_id: notification.actor_id,
      user_id: notification.user_id,
      current_user_id: activeUser?.id,
      isSeller: notification.user_id === currentUserId,
    });
  };

const handleSubmitOffer = async (price: string, message: string) => {
    if (!price || !message || !selectedNotification) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Check if this is a seller responding to intent
      const isSellerRespondingToIntent = 
        selectedNotification.type === "intent_match" && 
        selectedNotification.user_id === currentUserId;

      console.log('=== FRONTEND OFFER DEBUG ===');
      console.log('selectedNotification.type:', selectedNotification.type);
      console.log('selectedNotification.user_id:', selectedNotification.user_id);
      console.log('currentUserId:', currentUserId);
      console.log('isSellerRespondingToIntent:', isSellerRespondingToIntent);
      console.log('selectedNotification.payload?.intent_id:', selectedNotification.payload?.intent_id);
      console.log('selectedNotification.payload:', selectedNotification.payload); // Add full payload debug

      const offerPayload = {
        listing_id: selectedNotification.payload?.listing_id,
        amount: parseFloat(price.replace("$", "")),
        message: message,
        // Explicitly set buyer_id based on who is making the offer
        buyer_id: isSellerRespondingToIntent ? selectedNotification.user_id : currentUserId,
        // Add intent_id if seller is responding to intent
        ...(isSellerRespondingToIntent && { 
          intent_id: selectedNotification.payload?.intent_id 
        })
      };

      console.log('final offerPayload:', offerPayload);

      const result = await dispatch(createOfferThunk(offerPayload) as any);
      
      console.log('=== OFFER CREATION RESULT DEBUG ===');
      console.log('result.meta.requestStatus:', result.meta.requestStatus);
      console.log('result.payload:', result.payload);
      console.log('result.error:', result.error);
      
      if (result.meta.requestStatus === "fulfilled") {
        console.log('OFFER CREATION SUCCESSFUL - proceeding with notification update');
        const offerType = isSellerRespondingToIntent ? "Counter Offer" : "Offer";
        Alert.alert(
          `${offerType} Sent!`,
          `Your ${offerType.toLowerCase()} of ${price} has been sent.`,
          [
            {
              text: "Go to Chat",
              onPress: async () => {
                setShowOfferModal(false);
                dispatch(resetCreateStatus());
                // Navigate to deal room using the offer data
                const dealRoomId = result.payload.deal_room_id;
                if (dealRoomId) {
                  const actorId =
                    selectedNotification.actor_id ||
                    selectedNotification.user_id;
                  router.push(
                    `/deal-room/${dealRoomId}?listingId=${selectedNotification.payload?.listing_id}&participant1Id=${currentUser?.id}&participant2Id=${actorId}` as any
                  );
                } else {
                  Alert.alert("Info", "Deal room will be available shortly.");
                }
                // Update notification to show offer made (persist to backend)
                console.log('=== NOTIFICATION UPDATE DEBUG ===');
                console.log('Updating notification:', selectedNotification.id);
                console.log('Update payload:', {
                  status: isSellerRespondingToIntent ? "offer_countered" : "offer_created",
                  payload: {
                    ...selectedNotification.payload,
                    ...(isSellerRespondingToIntent ? { counter_offered: true } : { offer_made: true }),
                  },
                });
                
                const updateResult = await dispatch(
                  updateNotificationThunk({
                    id: selectedNotification.id,
                    data: {
                      status: isSellerRespondingToIntent ? "offer_countered" : "offer_created",
                      payload: {
                        ...selectedNotification.payload,
                        ...(isSellerRespondingToIntent ? { counter_offered: true } : { offer_made: true }),
                        deal_room_id: result.payload.deal_room_id, // Add deal room ID to notification payload
                      },
                    },
                  }) as any
                );
                
                console.log('Notification update result:', updateResult);
              },
            },
            {
              text: "OK",
              onPress: async () => {
                setShowOfferModal(false);
                dispatch(resetCreateStatus());
                // Update notification to show offer made (persist to backend)
                console.log('=== NOTIFICATION UPDATE DEBUG ===');
                console.log('Updating notification:', selectedNotification.id);
                console.log('Update payload:', {
                  status: isSellerRespondingToIntent ? "offer_countered" : "offer_created",
                  payload: {
                    ...selectedNotification.payload,
                    ...(isSellerRespondingToIntent ? { counter_offered: true } : { offer_made: true }),
                  },
                });
                
                const updateResult = await dispatch(
                  updateNotificationThunk({
                    id: selectedNotification.id,
                    data: {
                      status: isSellerRespondingToIntent ? "offer_countered" : "offer_created",
                      payload: {
                        ...selectedNotification.payload,
                        ...(isSellerRespondingToIntent ? { counter_offered: true } : { offer_made: true }),
                        deal_room_id: result.payload.deal_room_id, // Add deal room ID to notification payload
                      },
                    },
                  }) as any
                );
                
                console.log('Notification update result:', updateResult);
              },
            },
          ]
        );
      } else {
        // Handle backend error messages properly
        const errorMessage = result.payload || "Failed to send offer";
        Alert.alert("Error", errorMessage);
      }
    } catch (error: any) {
      // Fallback error handling
      const errorMessage =
        error?.message || "Failed to send offer. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onExpand={handleNotificationPress}
      onMarkAsRead={handleMarkAsRead}
      onAcceptOffer={handleAcceptOffer}
      onMakeOffer={handleMakeOffer}
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
        <ThemedText type="heading" style={styles.headerTitle}>
          Notifications
        </ThemedText>
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
              <ThemedText type="caption" style={styles.markAllButtonText}>
                Mark All Read
              </ThemedText>
            </TouchableOpacity>
          )}
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: theme.theme.colors.error },
              ]}
            >
              <Text style={[styles.unreadBadgeText, { color: "#FFFFFF" }]}>
                {unreadCount}
              </Text>
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
            notifications.length === 0
              ? styles.emptyContent
              : styles.listContent
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </PullToRefresh>

      {/* Offer Modal */}
      <OfferModal
        visible={showOfferModal}
        onClose={() => {
          setShowOfferModal(false);
          dispatch(resetCreateStatus());
        }}
        onSubmit={handleSubmitOffer}
        listing={{
          id: selectedNotification?.payload?.listing_id || "",
          title:
            selectedNotification?.payload?.listing_title ||
            "Item from notification",
          price:
            selectedNotification?.payload?.listing_price ||
            "Price not specified",
          image: selectedNotification?.actor_avatar || "",
          seller: loadingSeller ? "Loading..." : sellerName || "Seller",
        }}
        sellerOffer={
          selectedNotification?.type === "intent_match"
            ? ""
            : selectedNotification?.payload?.listing_price || ""
        }
        buyerOffer={
          selectedNotification?.type === "intent_match"
            ? selectedNotification?.payload?.buyer_max_price || ""
            : ""
        }
        isSeller={
          selectedNotification?.type === "intent_match"
            ? selectedNotification?.user_id === currentUserId // For intent_match, user_id is the seller
            : selectedNotification?.user_id === currentUserId
        }
        isSubmitting={isCreatingOffer}
      />

      {/* Debug info */}
      {__DEV__ && (
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: 8,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: "white", fontSize: 10 }}>
            Debug: actor_id={selectedNotification?.actor_id}
          </Text>
          <Text style={{ color: "white", fontSize: 10 }}>
            Debug: user_id={selectedNotification?.user_id}
          </Text>
          <Text style={{ color: "white", fontSize: 10 }}>
            Debug: current_user={activeUser?.id}
          </Text>
          <Text style={{ color: "white", fontSize: 10 }}>
            Debug: isSeller={selectedNotification?.user_id === currentUserId}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clearButton: {
    padding: 8,
  },
  markAllButton: {
    padding: 8,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  unreadBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  chatButton: {},
  acceptButton: {},
  acceptedButton: {},
  declineButton: {},
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
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
    borderWidth: 1,
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
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {},
  time: {
    fontSize: 12,
  },
  body: {
    fontSize: 14,
    marginBottom: 4,
  },
  unreadBody: {},
  actorName: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    marginTop: 16,
  },
  emptyBody: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
});
