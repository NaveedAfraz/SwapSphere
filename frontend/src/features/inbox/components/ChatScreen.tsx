import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import { fetchChatByIdThunk } from "@/src/features/inbox/chatThunks";
import {
  updateOfferThunk,
  counterOfferThunk,
  acceptOfferThunk,
} from "@/src/features/offer/offerThunks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Interactions } from "@/src/constants/theme";
import type { Message } from "../types/chat";

// Helper interface for UI message display
interface UIMessage {
  id: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  senderAvatar?: string;
}

// Transform Message to UIMessage for display
const transformMessage = (
  message: Message,
  currentUserId?: string
): UIMessage => ({
  id: message.id,
  text: message.body || "",
  timestamp: new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }),
  isOwn: message.sender_id === currentUserId,
  senderName: message.sender?.profile?.name,
  senderAvatar: message.sender?.profile?.avatar_key,
});

import MessageInput from "./MessageInput";
import OfferNegotiation from "./OfferNegotiation";
import MessageBubble from "./MessageBubble";

interface ChatScreenProps {
  conversationId: string;
  actualChatId?: string;
  userName: string;
  userAvatar: string;
  itemName?: string;
  itemImage?: string;
  originalPrice?: string;
  currentOffer?: number;
  isOwnOffer?: boolean;
  offerStatus?: string;
  offerId?: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  currentUserId?: string;
  isLoading?: boolean;
  error?: string;
}

export default function ChatScreen({
  conversationId,
  actualChatId,
  userName,
  userAvatar,
  itemName,
  itemImage,
  originalPrice,
  currentOffer,
  isOwnOffer = false,
  offerStatus,
  offerId,
  isLoading = false,
  error,
  messages: propMessages,
  onSendMessage,
  currentUserId,
}: ChatScreenProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [uiMessages, setUiMessages] = useState<UIMessage[]>(
    propMessages
      ? (() => {
          const transformed = propMessages.map((msg) =>
            transformMessage(msg, currentUserId)
          );
          const seen = new Set<string>();
          return transformed.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        })()
      : []
  );
  const [offer, setOffer] = useState(currentOffer);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [uiMessages]);

  // Update UI messages when prop messages change
  useEffect(() => {
    if (propMessages) {
      const transformedMessages = propMessages.map((msg) =>
        transformMessage(msg, currentUserId)
      );
      // Dedupe by id to avoid duplicate key errors if messages loaded twice
      const seen = new Set<string>();
      const deduped = transformedMessages.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setUiMessages(deduped);
    }
  }, [propMessages, currentUserId]);

  const handleSendMessage = (text: string) => {
    if (onSendMessage) {
      onSendMessage(text);
    }
  };

  const handleOfferUpdate = (newOffer: number) => {
    // Dispatch Redux action based on offer status and ownership
    if (offerId) {
      if (isOwnOffer) {
        // User is updating their own offer
        dispatch(updateOfferThunk({
            id: offerId,
            data: { counter_amount: newOffer },
          }) as any).then((result: any) => {
          // Refresh chat data to get updated offer information
          const chatIdToRefresh = actualChatId || conversationId;
          if (chatIdToRefresh) {
            dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
          }
        });
      } else {
        // User is making a counter offer to someone else's offer
        dispatch(
          counterOfferThunk({
            offer_id: offerId,
            counter_amount: newOffer,
          }) as any
        ).then((result: any) => {
          // Refresh chat data to get updated offer information
          const chatIdToRefresh = actualChatId || conversationId;
          if (chatIdToRefresh) {
            dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
          }
        });
      }
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading conversation...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const handleAcceptOffer = () => {
    if (!offerId) {
      console.error('No offer ID available for acceptance');
      return;
    }

    // Dispatch accept offer thunk
    dispatch(acceptOfferThunk(offerId) as any).then((result: any) => {
      console.log('Offer accepted successfully:', result);
      
      // Refresh chat data to get updated offer information
      const chatIdToRefresh = actualChatId || conversationId;
      if (chatIdToRefresh) {
        dispatch(fetchChatByIdThunk(chatIdToRefresh) as any);
      }
    }).catch((error: any) => {
      console.error('OFFER ACCEPT FAILED:', error);
    });
  };

  const renderMessage = ({ item }: { item: UIMessage }) => (
    <MessageBubble
      message={item.text}
      timestamp={item.timestamp}
      isOwn={item.isOwn}
      senderAvatar={item.senderAvatar}
      senderName={item.senderName}
    />
  );

  // Handle avatar URL - use full URL if available, otherwise fallback
  const avatarUrl =
    userAvatar && userAvatar.trim() !== "" && userAvatar.startsWith("http")
      ? userAvatar
      : userAvatar && userAvatar.trim() !== ""
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName
          .replace(/\s+/g, "")
          .toLowerCase()}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName
          .replace(/\s+/g, "")
          .toLowerCase()}`;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={Interactions.buttonOpacity}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.onlineStatus}>Online</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          activeOpacity={Interactions.buttonOpacity}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Offer Negotiation */}
      <OfferNegotiation
        itemName={itemName}
        itemImage={itemImage}
        originalPrice={originalPrice ? parseFloat(originalPrice) : undefined}
        currentOffer={currentOffer}
        isOwnOffer={isOwnOffer}
        offerStatus={offerStatus}
        offerId={offerId}
        conversationId={conversationId}
        actualChatId={actualChatId}
        onOfferUpdate={handleOfferUpdate}
        onAcceptOffer={
          !isOwnOffer && offerStatus !== "accepted"
            ? handleAcceptOffer
            : undefined
        }
      />

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.messagesContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={uiMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />
        <MessageInput onSendMessage={handleSendMessage} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  onlineStatus: {
    fontSize: 14,
    color: "#10B981",
  },
  moreButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
