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
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import OfferNegotiation from "./OfferNegotiation";

interface ChatScreenProps {
  conversationId: string;
  userName: string;
  userAvatar: string;
  itemName?: string;
  itemImage?: string;
  originalPrice?: number;
  currentOffer?: number;
  isOwnOffer?: boolean;
  offerStatus?: string; // Add offer status prop
  isLoading?: boolean;
  error?: string;
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  currentUserId?: string; // Add current user ID for message ownership
}

const mockUIMessages: UIMessage[] = [
  {
    id: "1",
    text: "Hi! Is this item still available?",
    timestamp: "2:30 PM",
    isOwn: false,
    senderName: "Sarah Johnson",
    senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
  },
  {
    id: "2",
    text: "Yes, it's still available! Are you interested?",
    timestamp: "2:32 PM",
    isOwn: true,
  },
  {
    id: "3",
    text: "Great! Can you tell me more about the condition?",
    timestamp: "2:33 PM",
    isOwn: false,
    senderName: "Sarah Johnson",
    senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
  },
  {
    id: "4",
    text: "It's in excellent condition, barely used. I bought it 6 months ago and it's been in a case the whole time.",
    timestamp: "2:35 PM",
    isOwn: true,
  },
  {
    id: "5",
    text: "Would you accept $150 for it?",
    timestamp: "2:36 PM",
    isOwn: false,
    senderName: "Sarah Johnson",
    senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
  },
];

export default function ChatScreen({
  conversationId,
  userName,
  userAvatar,
  itemName = "iPhone 13 Pro",
  itemImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
  originalPrice = 899,
  currentOffer = 150,
  isOwnOffer = false,
  offerStatus,
  isLoading = false,
  error,
  messages: propMessages,
  onSendMessage,
  currentUserId,
}: ChatScreenProps) {
  const router = useRouter();
  const [uiMessages, setUiMessages] = useState<UIMessage[]>(
    propMessages
      ? propMessages.map((msg) => transformMessage(msg, currentUserId))
      : mockUIMessages
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
      setUiMessages(
        propMessages.map((msg) => transformMessage(msg, currentUserId))
      );
    }
  }, [propMessages, currentUserId]);

  const handleSendMessage = (text: string) => {
    if (onSendMessage) {
      onSendMessage(text);
      return;
    }

    const newUIMessage: UIMessage = {
      id: Date.now().toString(),
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    setUiMessages((prev) => [...prev, newUIMessage]);

    // Simulate a response after 1 second
    setTimeout(() => {
      const responseUIMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        text: "Thanks for your message! I'll get back to you soon.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: false,
        senderName: userName,
        senderAvatar: userAvatar,
      };

      setUiMessages((prev) => [...prev, responseUIMessage]);
    }, 1000);
  };

  const handleOfferUpdate = (newOffer: number) => {
    setOffer(newOffer);

    const offerUIMessage: UIMessage = {
      id: Date.now().toString(),
      text: `Updated offer to $${newOffer}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    setUiMessages((prev) => [...prev, offerUIMessage]);
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
    const acceptUIMessage: UIMessage = {
      id: Date.now().toString(),
      text: `Great! I accept your offer of $${offer}. Let's proceed with the transaction.`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    setUiMessages((prev) => [...prev, acceptUIMessage]);
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
  const avatarUrl = userAvatar && userAvatar.trim() !== "" && userAvatar.startsWith("http")
    ? userAvatar
    : userAvatar && userAvatar.trim() !== ""
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.replace(/\s+/g, '').toLowerCase()}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName.replace(/\s+/g, '').toLowerCase()}`;

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
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
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
        originalPrice={originalPrice}
        currentOffer={offer}
        isOwnOffer={isOwnOffer}
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
