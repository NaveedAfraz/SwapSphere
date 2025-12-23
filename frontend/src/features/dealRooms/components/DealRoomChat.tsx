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
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '@/src/contexts/ThemeContext';
import { getCurrentUser } from '@/src/services/authService';
import { ThemedText } from '@/src/components/ThemedView';
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
import { updateOfferThunk, counterOfferThunk, acceptOfferThunk } from "../../../features/offer/offerThunks";
import OfferNegotiation from "../../../features/inbox/components/OfferNegotiation";
import PayNowButton from "../../../features/payment/components/PayNowButton";
import { Ionicons } from "@expo/vector-icons";
import { 
  connectSocket, 
  disconnectSocket, 
  joinChatRoom, 
  leaveChatRoom, 
  sendSocketMessage,
  onSocketMessage,
  onOfferUpdate,
  isSocketConnected
} from "../../../services/socketService";
import { useRouter } from 'expo-router';

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
  const activeUser = (user && user.id) ? user : getCurrentUser();
  
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentDealRoom, dealRooms, messages, sendMessageStatus, typing } =
    useAppSelector((state) => state.dealRooms);

  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [lastOfferUpdatedBy, setLastOfferUpdatedBy] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentStatusChecked, setPaymentStatusChecked] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate if this is the user's own offer based on who last updated it
  const calculatedIsOwnOffer = lastOfferUpdatedBy === activeUser?.id;

  const dealRoomMessages = messages[dealRoomId] || [];
  
  // Filter out any undefined or invalid messages
  const validMessages = dealRoomMessages.filter((m: Message) => m && m.id);

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
    console.log('[CHAT] Fetching deal room data for ID:', dealRoomId); dispatch(fetchDealRoom(dealRoomId));
    dispatch(fetchMessages({ dealRoomId }));
  }, [dealRoomId, dispatch]);

  // Check payment status when deal room data loads
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (currentDealRoom?.latest_order_id) {
        try {
          const { getOrderPayments } = require('../../../features/payment/api/paymentApi');
          const payments = await getOrderPayments(currentDealRoom.latest_order_id);
          
          if (payments && payments.length > 0) {
            const latestPayment = payments[0];
            const isCompleted = latestPayment.status === 'escrowed' || 
                              latestPayment.status === 'completed' || 
                              latestPayment.status === 'captured';
            setPaymentCompleted(isCompleted);
          } else {
            setPaymentCompleted(false);
          }
        } catch (error) {
          console.log('[DealRoomChat] Error checking payment status:', error);
          setPaymentCompleted(false);
        } finally {
          // Fallback: Check deal room order_status if payment API didn't detect completion
          if (!paymentCompleted && currentDealRoom?.order_status === 'paid') {
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
      console.log('[CHAT] Initialized last offer updated by to buyer:', currentDealRoom.latest_offer.buyer_id);
    }
  }, [currentDealRoom?.latest_offer, lastOfferUpdatedBy]);

  // Socket connection and real-time messaging
  useEffect(() => {
    let socketConnected = false;

    const initializeSocket = async () => {
      try {
        if (!isSocketConnected()) {
          await connectSocket();
        }
        socketConnected = true;
        
        // Join the deal room as a chat room
        joinChatRoom(dealRoomId);
        
        console.log('[CHAT] Socket initialized and joined room:', dealRoomId);
      } catch (error) {
        console.error('[CHAT] Failed to initialize socket:', error);
      }
    };

    initializeSocket();

    // Set up message listener
    const handleNewMessage = (message: any) => {
      console.log('[CHAT] Received new message via socket:', message);
      dispatch(addMessage({ dealRoomId, message }));
    };

    const handleOfferUpdate = (data: any) => {
      console.log('[CHAT] Received offer update via socket:', data);
      console.log('[CHAT] Refreshing deal room data for ID:', dealRoomId);
      
      // Set who made the latest offer update
      if (data.updatedBy) {
        setLastOfferUpdatedBy(data.updatedBy);
        console.log('[CHAT] Set last offer updated by:', data.updatedBy);
      }
      
      // Refresh deal room data to get updated offer information
      dispatch(fetchDealRoom(dealRoomId));
    };

    onSocketMessage(handleNewMessage);
    onOfferUpdate(handleOfferUpdate);

    return () => {
      if (socketConnected) {
        leaveChatRoom(dealRoomId);
        console.log('[CHAT] Left room and cleaned up socket:', dealRoomId);
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
    // console.log('[CHAT] Offer update - lastOfferUpdatedBy:', lastOfferUpdatedBy, 'currentUser:', activeUser?.id, 'calculatedIsOwnOffer:', calculatedIsOwnOffer);
    
    if (offerId) {
      if (calculatedIsOwnOffer) {
        // User is updating their own offer
        console.log('[CHAT] User updating their own offer - using updateOfferThunk');
        dispatch(updateOfferThunk({
            id: offerId,
            data: { counter_amount: newOffer },
          }));
        // No need to fetch deal room - socket events will update the UI in real-time
      } else {
        // User is making a counter offer to someone else's offer
        console.log('[CHAT] User making counter offer - using counterOfferThunk');
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
      console.error('No offer ID available for acceptance');
      return;
    }

    // Dispatch accept offer thunk
    dispatch(acceptOfferThunk(offerId) as any).then(() => {
      // Refresh deal room data to get updated offer information
      console.log('[CHAT] Fetching deal room data for ID:', dealRoomId); dispatch(fetchDealRoom(dealRoomId));
    }).catch((error: any) => {
      console.error('OFFER ACCEPT FAILED:', error);
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
        Alert.alert("Message Sent", "Message saved to database (real-time delivery unavailable)");
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
      console.warn('Invalid message item:', item);
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

      {/* Offer Negotiation - Hide when payment is completed or still checking status */}
      {itemName && !paymentCompleted && paymentStatusChecked && (
        <OfferNegotiation
          itemName={itemName}
          itemImage={itemImage}
          originalPrice={originalPrice}
          currentOffer={currentOffer}
          isOwnOffer={calculatedIsOwnOffer}
          offerStatus={offerStatus}
          offerId={offerId}
          conversationId={conversationId}
          actualChatId={actualChatId}
          buyerId={currentDealRoom?.buyer_id}
          sellerId={currentDealRoom?.seller_id}
          onOfferUpdate={handleOfferUpdate}
          onAcceptOffer={
            !calculatedIsOwnOffer && offerStatus !== "accepted"
              ? handleAcceptOffer
              : undefined
          }
        />
      )}

     
      {paymentCompleted && (
        <View style={{ padding: 16, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primary }}>
              ✓ {currentDealRoom?.buyer_id === activeUser?.id ? 'Purchase Completed' : 'Payment Received'}
            </ThemedText>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.accent,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              onPress={() => router.push(currentDealRoom?.buyer_id === activeUser?.id ? '/profile/my-purchases' : '/profile/sales')}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={currentDealRoom?.buyer_id === activeUser?.id ? "bag-outline" : "storefront-outline"} 
                size={16} 
                color={theme.colors.surface} 
                style={{ marginRight: 6 }} 
              />
              <ThemedText style={{ color: theme.colors.surface, fontWeight: '600', fontSize: 14 }}>
                {currentDealRoom?.buyer_id === activeUser?.id ? 'My Purchases' : 'My Sales'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText style={{ fontSize: 14, color: theme.colors.secondary, textAlign: 'center' }}>
            {currentDealRoom?.buyer_id === activeUser?.id 
              ? 'Your payment has been completed. Track your purchase in My Purchases.'
              : 'Payment has been received and is being held in escrow until delivery is confirmed.'
            }
          </ThemedText>
        </View>
      )}

      {/* Pay Now Button - Show if offer is accepted and user is buyer and payment not completed and status checked */}
      {offerStatus === "accepted" && currentDealRoom?.buyer_id === activeUser?.id && currentDealRoom?.latest_offer && !paymentCompleted && paymentStatusChecked && (
        <View style={{ padding: 16, backgroundColor: theme.colors.background }}>
          <ThemedText style={{ marginBottom: 12, textAlign: 'center' }}>
            Offer accepted! Complete payment to proceed with the transaction.
          </ThemedText>
          {/* {console.log('[DealRoomChat] PayNowButton props:', {
            orderId: currentDealRoom.latest_order_id || currentDealRoom.latest_offer?.id || '',
            amount: currentDealRoom.latest_offer?.offered_price || 0,
            offerData: currentDealRoom.latest_offer,
            orderData: {
              id: currentDealRoom.latest_order_id,
              status: currentDealRoom.order_status,
              amount: currentDealRoom.order_amount
            }
          })} */}
          <PayNowButton
            orderId={currentDealRoom.latest_order_id || currentDealRoom.latest_offer?.id || ''} // Use actual order ID, fallback to offer ID
            amount={parseFloat(String(currentDealRoom.latest_offer?.offered_price || '0'))}
            onPaymentSuccess={() => {
              console.log('[CHAT] Payment successful');
              setPaymentCompleted(true); // Update local state
              // Refresh deal room to get updated payment status
              dispatch(fetchDealRoom(dealRoomId));
            }}
            onPaymentError={(error) => {
              console.error('[CHAT] Payment failed:', error);
            }}
          />
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
      flexDirection: "row" as const,
      alignItems: "center" as const,
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
  });

export default DealRoomChat;
