import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
  FlatList,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "@/src/contexts/ThemeContext";
import { getCurrentUser } from "@/src/services/authService";
import { ThemedText } from "@/src/components/ThemedView";
import {
  fetchDealRoom,
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  addMessage,
  setTyping,
} from "../dealRoomSlice";
import { DealRoom, Message } from "../types/dealRoom";
import { dealRoomHelpers } from "../dealRoomThunks";
import { theme } from "../../../theme";
import DefaultAvatar from "./DefaultAvatar";
import {
  updateOfferThunk,
  counterOfferThunk,
  acceptOfferThunk,
} from "../../../features/offer/offerThunks";
import OfferNegotiation from "../../../features/inbox/components/OfferNegotiation";
import OfferHistory from "./OfferHistory";
import PayNowButton from "../../../features/payment/components/PayNowButton";
import { getOrderPaymentsThunk } from "../../../features/payment/paymentThunks";
import { Ionicons } from "@expo/vector-icons";
import {
  connectSocket,
  disconnectSocket,
  joinChatRoom,
  leaveChatRoom,
  sendSocketMessage,
  onSocketMessage,
  onOfferUpdate,
  isSocketConnected,
} from "../../../services/socketService";
import { useRouter } from "expo-router";
import { SwapOfferPayload } from "../types/swapOffer";
import StartAuctionModal from "../../../features/auction/components/StartAuctionModal";
import { createAuction } from "../../../features/auction/auctionThunks";
import { fetchAuction } from "../../../features/auction/auctionThunks";

interface DealRoomChatProps {
  dealRoomId: string;
  onBack: () => void;
  itemName?: string;
  itemImage?: string;
  originalPrice?: number;
  currentOffer?: number;
  isOwnOffer?: boolean;
  offerStatus?: string;
  offerId?: string;
  conversationId?: string;
  actualChatId?: string;
}

const AuctionBanner = ({
  onPress,
  theme,
}: {
  onPress: () => void;
  theme: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      getStyles(theme).bannerContainer,
      { backgroundColor: theme.colors.accent },
    ]}
  >
    <Ionicons name="hammer" size={20} color={theme.colors.surface} />
    <ThemedText style={getStyles(theme).bannerText}>
      Seller has started a private auction. [Join Auction]
    </ThemedText>
  </TouchableOpacity>
);

const DealRoomChat: React.FC<DealRoomChatProps> = ({
  dealRoomId,
  onBack,
  itemName,
  itemImage,
  originalPrice,
  currentOffer,
  isOwnOffer = false,
  offerStatus,
  offerId,
  conversationId,
  actualChatId,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const router = useRouter();

  // Use unified auth service for user data
  const activeUser = user && user.id ? user : getCurrentUser();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentDealRoom, dealRooms, messages, sendMessageStatus, typing } =
    useAppSelector((state) => state.dealRooms);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [lastOfferUpdatedBy, setLastOfferUpdatedBy] = useState<string | null>(
    null
  );
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentStatusChecked, setPaymentStatusChecked] = useState(false);
  const [showOfferHistory, setShowOfferHistory] = useState(false);
  const [orderType, setOrderType] = useState<string>("cash");
  const [showStartAuctionModal, setShowStartAuctionModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate if this is the user's own offer based on who last updated it
  const calculatedIsOwnOffer = lastOfferUpdatedBy === activeUser?.id;

  // Determine if user is seller and can start auction
  const isSeller = currentDealRoom?.seller_user_id === activeUser?.id;

  // Determine current status - prioritize deal room state over order status
  const currentStatus = currentDealRoom?.current_state || offerStatus;
  console.log(currentStatus);
  const [showCurrentOrderStatus, setShowCurrentOrderStatus] = useState(false);

  useEffect(() => {
    const excludedStatuses = [
      "negotiation",
      "accepted",
      "offer_accepted",
      "pending",
      "paid",
      "shipped",
      "delivered",
      "completed",
      "countered",
    ];
    const shouldShow = Boolean(currentStatus && !excludedStatuses.includes(currentStatus));
    setShowCurrentOrderStatus(shouldShow);
  }, [currentStatus]);

  const dealRoomMessages = messages[dealRoomId] || [];

  // Filter out any undefined or invalid messages
  const validMessages = dealRoomMessages.filter((m: Message) => m && m.id);
  const canStartAuction =
    isSeller &&
    currentDealRoom?.current_state === "negotiation" &&
    !currentDealRoom?.metadata?.auction_id;

  console.log('Auction availability check:', { 
    dealRoomId, 
    isSeller, 
    currentState: currentDealRoom?.current_state, 
    hasAuctionId: !!currentDealRoom?.metadata?.auction_id, 
    canStartAuction 
  });

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    // Only fetch messages, deal room data is handled by parent
    dispatch(fetchMessages({ dealRoomId }));
    
    // Reset ALL state when switching deal rooms
    setShowStartAuctionModal(false);
    setShowOfferHistory(false);
    setPaymentCompleted(false);
    setShowCurrentOrderStatus(false);
    setPaymentStatusChecked(false);
    
    console.log('Switched to deal room:', dealRoomId, '- Reset all state');
  }, [dealRoomId, dispatch]);

  // Fetch order data to get order type
  useEffect(() => {
    const fetchOrderType = async () => {
      // Only run if we have current deal room data and it belongs to this deal room
      if (currentDealRoom?.latest_order_id && currentDealRoom.id === dealRoomId) {
        try {
          // Try to get order type from offer history first
          if (
            currentDealRoom.offer_history &&
            currentDealRoom.offer_history.length > 0
          ) {
            const acceptedOffer = currentDealRoom.offer_history.find(
              (offer) => offer.status === "accepted"
            );
            if (acceptedOffer && acceptedOffer.offer_type) {
              setOrderType(acceptedOffer.offer_type);
              return;
            }
          }

          // Fallback: Fetch order data to get order_type
          const response = await fetch(
            `/api/orders/${currentDealRoom.latest_order_id}`
          );
          if (response.ok) {
            const order = await response.json();
            if (order.order_type) {
              setOrderType(order.order_type);
            }
          }
        } catch (error) {}
      }
    };

    fetchOrderType();
  }, [currentDealRoom?.latest_order_id, currentDealRoom?.offer_history]);

  // Check payment status when deal room data loads
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Only run if we have current deal room data and it belongs to this deal room
      if (currentDealRoom?.latest_order_id && currentDealRoom.id === dealRoomId) {
        try {
          const result = await dispatch(
            getOrderPaymentsThunk(currentDealRoom.latest_order_id)
          );
          if (getOrderPaymentsThunk.fulfilled.match(result)) {
            const payments = result.payload;
            if (payments && payments.length > 0) {
              const latestPayment = payments[0];
              const isCompleted =
                latestPayment.status === "escrowed" ||
                latestPayment.status === "completed" ||
                latestPayment.status === "captured";
              setPaymentCompleted(isCompleted);
            } else {
              setPaymentCompleted(false);
            }
          }
        } catch (error) {
          setPaymentCompleted(false);
        } finally {
          // Fallback: Check deal room order_status if payment API didn't detect completion
          if (
            !paymentCompleted &&
            (currentDealRoom?.order_status === "paid" ||
              currentDealRoom?.order_status === "completed")
          ) {
            setPaymentCompleted(true);
          }

          setPaymentStatusChecked(true); // Mark as checked regardless of outcome
        }
      } else {
        // No order ID to check, mark as checked
        setPaymentStatusChecked(true);
      }
    };

    checkPaymentStatus();
  }, [currentDealRoom?.latest_order_id]);

  // Initialize lastOfferUpdatedBy when deal room data loads (only if not already set by socket)
  useEffect(() => {
    if (currentDealRoom?.latest_offer && !lastOfferUpdatedBy) {
      // Initially, assume the buyer made the offer
      setLastOfferUpdatedBy(currentDealRoom.latest_offer.buyer_id);
    }
  }, [currentDealRoom?.latest_offer, lastOfferUpdatedBy]);

  // Socket connection and real-time messaging
  useEffect(() => {
    let socketConnected = false;

    const initializeSocket = async () => {
      try {
        if (!isSocketConnected()) {
          await connectSocket();
          socketConnected = true;
          // Join the deal room as a chat room
          joinChatRoom(dealRoomId);
        }
      } catch (error) {
        console.error("[CHAT] Failed to initialize socket:", error);
      }
    };

    initializeSocket();

    // Set up message listener
    const handleNewMessage = (message: any) => {
      dispatch(addMessage({ dealRoomId, message }));
    };

    const handleOfferUpdate = (data: any) => {
      // Set who made the latest offer update
      if (data.updatedBy) {
        setLastOfferUpdatedBy(data.updatedBy);
      }

      // Refresh deal room data to get updated offer information
      dispatch(fetchDealRoom(dealRoomId));
    };

    onSocketMessage(handleNewMessage);
    onOfferUpdate(handleOfferUpdate);

    return () => {
      if (socketConnected) {
        leaveChatRoom(dealRoomId);
      }
    };
  }, [dealRoomId, dispatch]);

  useEffect(() => {
    // Mark unread messages as read
    const unreadMessages = validMessages.filter((m: Message) => !m.is_read);
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m: Message) => m.id);
      dispatch(markMessagesAsRead({ dealRoomId, message_ids: messageIds }));
    }
  }, [validMessages, dealRoomId, dispatch]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (validMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [validMessages.length]);

  const handleOfferUpdate = (newOffer: number) => {
    if (offerId) {
      if (calculatedIsOwnOffer) {
        // User is updating their own offer
        dispatch(
          updateOfferThunk({
            id: offerId,
            data: {
              counter_amount: newOffer,
              offer_type: "cash",
              cash_amount: newOffer,
              swap_items: [],
            },
          })
        );
        // No need to fetch deal room - socket events will update the UI in real-time
      } else {
        // User is making a counter offer to someone else's offer
        dispatch(
          counterOfferThunk({
            offer_id: offerId,
            counter_amount: newOffer,
          }) as any
        );
        // No need to fetch deal room - socket events will update the UI in real-time
      }
    }
  };

  const handleAcceptOffer = () => {
    if (!offerId) {
      console.error("No offer ID available for acceptance");
      return;
    }

    // Dispatch accept offer thunk
    dispatch(acceptOfferThunk(offerId) as any)
      .then(() => {
        // Refresh deal room data to get updated offer information
        dispatch(fetchDealRoom(dealRoomId));
      })
      .catch((error: any) => {
        console.error("OFFER ACCEPT FAILED:", error);
      });
  };

  const handleSendMessage = async () => {
    if (messageText.trim() === "") return;

    try {
      // Try to send via socket first for real-time delivery
      if (isSocketConnected()) {
        sendSocketMessage(dealRoomId, messageText.trim());
        setMessageText("");
      } else {
        // Fallback to Redux dispatch if socket fails
        await dispatch(
          sendMessage({
            dealRoomId,
            payload: { body: messageText.trim() },
          })
        ).unwrap();
        setMessageText("");
        Alert.alert(
          "Message Sent",
          "Message saved to database (real-time delivery unavailable)"
        );
      }
    } catch (error) {
      // Try Redux as final fallback
      try {
        await dispatch(
          sendMessage({
            dealRoomId,
            payload: { body: messageText.trim() },
          })
        ).unwrap();
        setMessageText("");
        Alert.alert("Message Sent", "Message saved to database");
      } catch (reduxError) {
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    }
  };

  const handleStartAuction = () => {
    if (!currentDealRoom) return;

    const auctionData = {
      directDealId: dealRoomId,
      startPrice: currentOffer || originalPrice || 0,
      minIncrement: 100, // Default increment
      durationMinutes: 30, // Default 30 minutes
      inviteeIds: [currentDealRoom.buyer_id].filter(Boolean), // Invite the buyer
    };

    dispatch(createAuction(auctionData))
      .unwrap()
      .then((result) => {
        Alert.alert("Success", "Auction created successfully!");
        setShowStartAuctionModal(false);
        // Navigate to auction deal room
        router.push(`/deal-room/${dealRoomId}-auction` as any);
      })
      .catch((error) => {
        Alert.alert("Error", "Failed to create auction. Please try again.");
        console.error("Create auction error:", error);
      });
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      // TODO: Emit typing event via socket
    } else if (isTyping && text.length === 0) {
      setIsTyping(false);
      // TODO: Emit stop typing event via socket
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Use the actual logged-in user ID
    const currentUserId = activeUser?.id;

    // Defensive coding to handle undefined message data
    if (!item || !item.id) {
      console.warn("Invalid message item:", item);
      return null;
    }

    const isOwnMessage = item.sender_id === currentUserId;
    const isSystemMessage = item.is_system;

    if (isSystemMessage) {
      return (
        <View
          key={item.id || `system-${index}`}
          style={getStyles(theme).systemMessageContainer}
        >
          <ThemedText style={getStyles(theme).systemMessageText}>
            {item.body}
          </ThemedText>
        </View>
      );
    }

    return (
      <View
        key={item.id || `message-${index}`}
        style={[
          getStyles(theme).messageContainer,
          isOwnMessage
            ? getStyles(theme).ownMessage
            : getStyles(theme).otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <View style={getStyles(theme).avatarContainer}>
            {item.sender_avatar ? (
              <Image
                source={{ uri: item.sender_avatar }}
                style={getStyles(theme).messageAvatar}
              />
            ) : (
              <DefaultAvatar size={32} name={item.sender_name || "User"} />
            )}
          </View>
        )}

        <View
          style={[
            getStyles(theme).messageBubble,
            isOwnMessage
              ? getStyles(theme).ownBubble
              : getStyles(theme).otherBubble,
          ]}
        >
          <ThemedText
            style={[
              getStyles(theme).messageText,
              isOwnMessage
                ? getStyles(theme).ownMessageText
                : getStyles(theme).otherMessageText,
            ]}
          >
            {item.body}
          </ThemedText>

          <ThemedText
            style={[
              getStyles(theme).messageTime,
              isOwnMessage
                ? getStyles(theme).ownMessageTime
                : getStyles(theme).otherMessageTime,
            ]}
          >
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    // Get deal room data from the list first, fallback to currentDealRoom
    const dealRoomData =
      dealRooms.find((dr) => dr.id === dealRoomId) || currentDealRoom;

    // Always show header, even while loading
    const formattedDealRoom = dealRoomData
      ? dealRoomHelpers.formatDealRoomForDisplay(dealRoomData, activeUser?.id)
      : {
          display_name: "Loading...",
          display_avatar: null,
          listing_title: "",
          state_display_name: "Loading...",
        };

    return (
      <View style={getStyles(theme).header}>
        <TouchableOpacity onPress={onBack} style={getStyles(theme).backButton}>
          <ThemedText style={getStyles(theme).backButtonText}>←</ThemedText>
        </TouchableOpacity>

        <View style={getStyles(theme).headerInfo}>
          {formattedDealRoom.display_avatar ? (
            <Image
              source={{ uri: formattedDealRoom.display_avatar }}
              style={getStyles(theme).headerAvatar}
            />
          ) : (
            <DefaultAvatar size={40} name={formattedDealRoom.display_name} />
          )}
          <View style={getStyles(theme).headerText}>
            <ThemedText style={getStyles(theme).headerName}>
              {formattedDealRoom.display_name}
            </ThemedText>
            <ThemedText style={getStyles(theme).headerItem}>
              {formattedDealRoom.listing_title || "Loading..."}
            </ThemedText>
          </View>
        </View>

        <View style={getStyles(theme).statusContainer}>
          <View
            style={[
              getStyles(theme).statusBadge,
              {
                backgroundColor: dealRoomData
                  ? getStatusColor(dealRoomData.current_state)
                  : theme.colors.border,
              },
            ]}
          >
            <ThemedText style={getStyles(theme).statusText}>
              {formattedDealRoom.state_display_name}
            </ThemedText>
          </View>

          {/* Start Auction Button - Seller Only */}
          {canStartAuction && (
            <TouchableOpacity
              style={[getStyles(theme).startAuctionButton]}
              onPress={() => setShowStartAuctionModal(true)}
            >
              <Ionicons name="hammer" size={16} color={theme.colors.surface} />
              <ThemedText style={getStyles(theme).startAuctionText}>
                Start Auction
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const getStatusColor = (state: string): string => {
    const colors: Record<string, string> = {
      negotiation: theme.colors.accent,
      payment_pending: theme.colors.warning,
      payment_completed: theme.colors.success,
      shipping: theme.colors.info,
      delivered: theme.colors.success,
      completed: theme.colors.success,
      cancelled: theme.colors.border,
      disputed: theme.colors.error,
    };
    return colors[state] || theme.colors.border;
  };

  return (
    <View style={[getStyles(theme).safeArea, { paddingTop: insets.top }]}>
      {renderHeader()}

      {currentDealRoom?.metadata?.auction_id && (
        <AuctionBanner
          theme={theme}
          onPress={() => router.push(`/deal-room/${dealRoomId}-auction` as any)}
        />
      )}

      {/* Offer Negotiation - Hide when payment is completed, still checking status, or order is in advanced status */}
      {itemName &&
        !paymentCompleted &&
        paymentStatusChecked &&
        currentStatus !== "accepted" &&
        currentStatus !== "offer_accepted" && (
          <OfferNegotiation
            itemName={itemName}
            itemImage={itemImage}
            originalPrice={originalPrice}
            currentOffer={currentOffer}
            isOwnOffer={calculatedIsOwnOffer}
            offerStatus={currentStatus}
            offerId={offerId}
            conversationId={conversationId}
            actualChatId={actualChatId}
            buyerId={currentDealRoom?.buyer_id}
            sellerId={currentDealRoom?.seller_id}
            lastOfferUpdatedBy={lastOfferUpdatedBy || undefined}
            onOfferUpdate={handleOfferUpdate}
            onAcceptOffer={handleAcceptOffer}
            listingId={currentDealRoom?.listing_id}
            currentDealOffer={
              currentDealRoom?.latest_offer
                ? {
                    id: currentDealRoom.latest_offer.id,
                    dealRoomId: currentDealRoom.id,
                    type:
                      (currentDealRoom.latest_offer as any).offer_type ||
                      "cash",
                    cashAmount: parseFloat(
                      (currentDealRoom.latest_offer as any).cash_amount ||
                        currentDealRoom.latest_offer.offered_price ||
                        "0"
                    ),
                    swapItems:
                      (currentDealRoom.latest_offer as any).swap_items || [],
                    status: currentDealRoom.latest_offer.status as
                      | "pending"
                      | "accepted"
                      | "countered",
                    createdAt: currentDealRoom.latest_offer.created_at,
                    updatedAt: (currentDealRoom.latest_offer as any).updated_at,
                    buyerId: currentDealRoom.latest_offer.buyer_id,
                    sellerId: currentDealRoom.latest_offer.seller_id,
                    metadata:
                      (currentDealRoom.latest_offer as any).metadata || {},
                  }
                : undefined
            }
          />
        )}

      {/* Current Order Status Display */}
      {showCurrentOrderStatus && (
        <View
          style={{
            padding: 16,
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <ThemedText
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.primary,
              }}
            >
              Order Status
            </ThemedText>
            <View
              style={{
                backgroundColor:
                  currentStatus === "delivered"
                    ? "#3B82F6"
                    : currentStatus === "completed"
                    ? "#10B981"
                    : currentStatus === "shipped"
                    ? "#F59E0B"
                    : currentStatus === "paid"
                    ? "#10B981"
                    : "#6B7280",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                }}
              >
                {currentStatus === "delivered"
                  ? "Delivered"
                  : currentStatus === "completed"
                  ? "Completed"
                  : currentStatus === "shipped"
                  ? "Shipped"
                  : currentStatus === "paid"
                  ? "Paid"
                  : (currentStatus || "").charAt(0).toUpperCase() +
                    (currentStatus || "").slice(1)}
              </ThemedText>
            </View>
          </View>
          <ThemedText
            style={{
              fontSize: 14,
              color: theme.colors.secondary,
              textAlign: "center",
            }}
          >
            {currentStatus === "delivered"
              ? "You marked this order as delivered. Waiting for buyer confirmation."
              : currentStatus === "completed"
              ? "Order completed! Payment has been released to your account."
              : currentStatus === "shipped"
              ? "You have shipped this order. Track delivery in My Sales."
              : currentStatus === "paid"
              ? "Payment received and held in escrow until delivery."
              : `Order status: ${currentStatus}`}
          </ThemedText>
        </View>
      )}

      {paymentCompleted && (
        <View
          style={{
            padding: 16,
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <ThemedText style={{ marginBottom: 8, fontWeight: "600" }}>
            {currentDealRoom?.buyer_id === activeUser?.id
              ? "Purchase Completed"
              : "Payment Received"}
          </ThemedText>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.accent,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() =>
              router.push(
                currentDealRoom?.buyer_id === activeUser?.id
                  ? "/profile/my-purchases"
                  : "/profile/sales"
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                currentDealRoom?.buyer_id === activeUser?.id
                  ? "bag-outline"
                  : "storefront-outline"
              }
              size={16}
              color={theme.colors.surface}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              style={{
                color: theme.colors.surface,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {currentDealRoom?.buyer_id === activeUser?.id
                ? "My Purchases"
                : "My Sales"}
            </ThemedText>
          </TouchableOpacity>
          <ThemedText
            style={{
              fontSize: 14,
              color: theme.colors.secondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {currentDealRoom?.buyer_id === activeUser?.id
              ? "Your payment has been completed. Track your purchase in My Purchases."
              : "Payment has been received and is being held in escrow until delivery is confirmed."}
          </ThemedText>
        </View>
      )}
             {/* Pay Now Button - Show if offer is accepted and user is buyer and payment not completed and status checked and it's a cash offer */}
      {(currentStatus === "accepted" || currentStatus === "offer_accepted") &&
        currentDealRoom?.buyer_id === activeUser?.id &&
        currentDealRoom?.latest_order_id &&
        !paymentCompleted &&
        paymentStatusChecked &&
        orderType === "cash" && (
          <View
            style={{ padding: 16, backgroundColor: theme.colors.background }}
          >
            <ThemedText style={{ marginBottom: 12, textAlign: "center" }}>
              Offer accepted! Complete payment to proceed with the transaction.
            </ThemedText>
            <PayNowButton
              orderId={currentDealRoom.latest_order_id || ""}
              amount={parseFloat(
                String(
                  currentDealRoom.order_amount ||
                    currentDealRoom.latest_offer?.offered_price ||
                    "0"
                )
              )}
              onPaymentSuccess={() => {
                setPaymentCompleted(true); // Update local state
                // Refresh deal room to get updated payment status
                dispatch(fetchDealRoom(dealRoomId));
              }}
              onPaymentError={(error) => {
                console.error("[CHAT] Payment failed:", error);
              }}
            />
          </View>
        )}

      {/* Terms & Conditions Button - Show for swap offers that are accepted */}
      {(currentStatus === "accepted" || currentStatus === "offer_accepted") &&
        currentDealRoom?.latest_order_id &&
        !paymentCompleted &&
        paymentStatusChecked &&
        orderType === "hybrid" && (
          <View
            style={{ padding: 16, backgroundColor: theme.colors.background }}
          >
            <ThemedText style={{ marginBottom: 12, textAlign: "center" }}>
              Offer accepted! Please review the terms and conditions for
              in-person exchange.
            </ThemedText>
            <TouchableOpacity
              style={{
                backgroundColor: "#3B82F6",
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() => router.push("/support/terms")}
            >
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                View Terms & Conditions
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

      <View style={getStyles(theme).contentContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={getStyles(theme).messagesScrollView}
          contentContainerStyle={getStyles(theme).messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {validMessages.map((item: Message, index: number) =>
            renderMessage({ item, index })
          )}
        </ScrollView>

        <View
          style={[
            getStyles(theme).inputContainer,
            {
              paddingBottom: keyboardHeight > 0 ? "15%" : insets.bottom || 12,
              marginBottom: keyboardHeight,
            },
          ]}
        >
          <View style={getStyles(theme).inputWrapper}>
            <TextInput
              style={getStyles(theme).textInput}
              value={messageText}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.secondary}
              multiline
              maxLength={1000}
              autoFocus={false}
              selectTextOnFocus={false}
            />

            {/* Offer History Button */}
            {currentDealRoom?.offer_history &&
              currentDealRoom.offer_history.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowOfferHistory(!showOfferHistory)}
                  style={{
                    padding: 8,
                    marginRight: 8,
                    backgroundColor: showOfferHistory ? "#3B82F6" : "#F3F4F6",
                    borderRadius: 6,
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={showOfferHistory ? "#FFFFFF" : "#6B7280"}
                  />
                </TouchableOpacity>
              )}

            <TouchableOpacity
              style={[
                getStyles(theme).sendButton,
                messageText.trim()
                  ? getStyles(theme).sendButtonActive
                  : getStyles(theme).sendButtonInactive,
              ]}
              onPress={handleSendMessage}
              disabled={
                messageText.trim() === "" || sendMessageStatus === "loading"
              }
            >
              <ThemedText
                style={[
                  getStyles(theme).sendButtonText,
                  {
                    color: messageText.trim()
                      ? theme.colors.surface
                      : theme.colors.secondary,
                  },
                ]}
              >
                {sendMessageStatus === "loading" ? "..." : "Send"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Start Auction Modal */}
      {showStartAuctionModal && (
        <StartAuctionModal
          visible={showStartAuctionModal}
          onClose={() => setShowStartAuctionModal(false)}
          dealRoomId={dealRoomId}
          listingId={currentDealRoom?.listing_id || ""}
          sellerId={currentDealRoom?.seller_user_id || ""}
          currentOffer={currentOffer}
          availableBuyers={
            currentDealRoom?.buyer_id
              ? [
                  {
                    user_id: currentDealRoom.buyer_id,
                    name: currentDealRoom.buyer_name || "Buyer",
                    avatar: currentDealRoom.buyer_avatar,
                    last_offer_amount: currentOffer,
                  },
                ]
              : []
          }
        />
      )}

      {/* Offer History Modal */}
      {showOfferHistory && currentDealRoom?.offer_history && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 12,
              width: "90%",
              height: "75%",
              maxHeight: "80%",
              margin: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: theme.colors.primary,
                }}
              >
                Offer History ({currentDealRoom.offer_history.length})
              </Text>
              <TouchableOpacity onPress={() => setShowOfferHistory(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <OfferHistory
              offerHistory={currentDealRoom.offer_history}
              currentUserId={activeUser?.id || ""}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,
    contentContainer: {
      flex: 1,
    } as ViewStyle,
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between",
      alignItems: "center" as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    } as ViewStyle,
    backButton: {
      marginRight: 16,
    } as ViewStyle,
    backButtonText: {
      fontSize: 24,
      color: theme.colors.primary,
      fontWeight: "600",
    } as TextStyle,
    headerInfo: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    } as ViewStyle,
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    } as ImageStyle,
    headerText: {
      flex: 1,
    } as ViewStyle,
    headerName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
    } as TextStyle,
    headerItem: {
      fontSize: 14,
      color: theme.colors.secondary,
    } as TextStyle,
    statusContainer: {
      flexDirection: "column" as const,
      alignItems: "flex-end" as const,
    } as ViewStyle,
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    } as ViewStyle,
    statusText: {
      fontSize: 12,
      color: theme.colors.surface,
      fontWeight: "500",
    } as TextStyle,
    messagesScrollView: {
      flex: 1,
    } as ViewStyle,
    messagesContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      flexGrow: 1,
    } as ViewStyle,
    messageContainer: {
      marginVertical: 4,
      maxWidth: "80%",
    } as ViewStyle,
    ownMessage: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    } as ViewStyle,
    otherMessage: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    } as ViewStyle,
    messageAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 4,
    } as ImageStyle,
    avatarContainer: {
      marginRight: 8,
      alignItems: "flex-end" as const,
    } as ViewStyle,
    messageBubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      minWidth: 60,
    } as ViewStyle,
    ownBubble: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    } as ViewStyle,
    otherBubble: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomLeftRadius: 4,
    } as ViewStyle,
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    } as TextStyle,
    ownMessageText: {
      color: theme.colors.surface,
    } as TextStyle,
    otherMessageText: {
      color: theme.colors.primary,
    } as TextStyle,
    messageTime: {
      fontSize: 11,
      marginTop: 4,
    } as TextStyle,
    ownMessageTime: {
      color: theme.colors.surface,
      textAlign: "right",
      opacity: 0.7,
    } as TextStyle,
    otherMessageTime: {
      color: theme.colors.secondary,
      textAlign: "left",
    } as TextStyle,
    systemMessageContainer: {
      alignItems: "center" as const,
      marginVertical: 8,
    } as ViewStyle,
    systemMessageText: {
      fontSize: 12,
      color: theme.colors.secondary,
      fontStyle: "italic" as const,
      backgroundColor: theme.colors.subtle,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    } as TextStyle,
    inputContainer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    } as ViewStyle,
    inputWrapper: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      paddingHorizontal: 20,
      paddingVertical: 12,
    } as ViewStyle,
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      fontSize: 16,
      color: theme.colors.primary,
      maxHeight: 100,
    } as TextStyle,
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    } as ViewStyle,
    sendButtonActive: {
      backgroundColor: theme.colors.primary,
    } as ViewStyle,
    sendButtonInactive: {
      backgroundColor: theme.colors.subtle,
    } as ViewStyle,
    sendButtonText: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: "600",
    } as TextStyle,
    startAuctionButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
    } as ViewStyle,
    startAuctionText: {
      color: theme.colors.surface,
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
    } as TextStyle,
    bannerContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    } as ViewStyle,
    bannerText: {
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 12,
    } as TextStyle,
  });

export default DealRoomChat;
