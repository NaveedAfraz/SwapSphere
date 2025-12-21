import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import type { Chat } from "../types/chat";

interface ConversationListProps {
  conversations: Chat[];
  onPressConversation: (id: string) => void;
}

export default function ConversationList({
  conversations,
  onPressConversation,
}: ConversationListProps) {
  const { theme } = useTheme();

    
  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubble-outline"
            size={48}
            color={theme.colors.secondary}
          />
          <ThemedText type="body" style={styles.emptyStateText}>
            No conversations yet
          </ThemedText>
          <ThemedText type="caption" style={styles.emptyStateSubtext}>
            Start a conversation to see messages here
          </ThemedText>
        </View>
      ) : (
        conversations.map((conversation) => {
          // Find the other participant if available
          const currentUserId = undefined; // optional: could be passed in future
          const otherParticipant =
            conversation.participants?.find(
              (p) => p.user && p.user.id !== currentUserId
            ) || conversation.participants?.[0];

          const user = otherParticipant?.user;
          const profile = user?.profile;

          // Prefer backend-provided fields when available
          const displayName =
            conversation.other_user_name || profile?.name || "Unknown User";
          const displayAvatar =
            conversation.other_user_avatar ||
            profile?.profile_picture_url ||
            "";

          // Last message handling (support various shapes)
          const lastMessageBody =
            (typeof conversation.last_message === "string"
              ? conversation.last_message
              : "") ||
            (typeof conversation.last_message === "object" &&
              conversation.last_message?.body) ||
            (conversation.lastMessage && conversation.lastMessage.body) ||
            "";
          const lastMessageTime =
            conversation.last_message_at ||
            (typeof conversation.last_message === "object" &&
              conversation.last_message?.created_at) ||
            "";

          const listingTitle =
            conversation.listing_title ||
            conversation.listing?.title ||
            "Unknown Item";
          const listingImage =
            conversation.listing_image ||
            conversation.listing?.primary_image_url ||
            "";
          const unreadCount = conversation.unread_count || 0;

          const convId = String(conversation.id);

          return (
            <TouchableOpacity
              key={convId}
              style={styles.conversationItem}
              onPress={() => onPressConversation(convId)}
              activeOpacity={Interactions.activeOpacity}
            >
              <Image
                source={{
                  uri:
                    displayAvatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      displayName
                    )}`,
                }}
                style={styles.avatar}
              />
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <ThemedText type="body" style={styles.name}>
                    {displayName}
                  </ThemedText>
                  <ThemedText type="caption" style={styles.time}>
                    {lastMessageTime
                      ? (() => {
                          try {
                            const date = new Date(lastMessageTime);
                            return isNaN(date.getTime())
                              ? ""
                              : date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                          } catch {
                            return "";
                          }
                        })()
                      : ""}
                  </ThemedText>
                </View>
                <View style={styles.listingRow}>
                  <Image
                    source={{
                      uri:
                        listingImage ||
                        `https://picsum.photos/seed/${encodeURIComponent(
                          convId
                        )}/40/40`,
                    }}
                    style={styles.listingImage}
                  />
                  <ThemedText type="caption" style={styles.listingName}>
                    {listingTitle}
                  </ThemedText>
                </View>
                <Text
                  style={[
                    styles.lastMessage,
                    { color: theme.colors.secondary },
                  ]}
                  numberOfLines={2}
                >
                  {lastMessageBody || "No messages yet"}
                </Text>
              </View>
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.unreadIndicator,
                    { backgroundColor: theme.colors.accent },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={[styles.unreadCount, { color: "#FFFFFF" }]}
                  >
                    {unreadCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,

    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  time: {
    fontSize: 12,
  },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  listingImage: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 6,
  },
  listingName: {
    fontSize: 14,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadIndicator: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
