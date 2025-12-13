import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import ConversationList from "../../src/features/inbox/components/ConversationList";
import InboxTabs from "../../src/features/inbox/components/InboxTabs";

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
};

const dummyConversations = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    lastMessage:
      "Hi! Is this item still available? I'm interested in the vintage camera.",
    time: "2 min ago",
    unread: 2,
    listing: "Vintage Camera 1950s",
    listingImage: "https://picsum.photos/seed/camera/40/40",
  },
  {
    id: 2,
    name: "Mike Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    lastMessage: "Can we meet tomorrow to check out the laptop?",
    time: "1 hour ago",
    unread: 1,
    listing: "MacBook Pro 2020",
    listingImage: "https://picsum.photos/seed/laptop/40/40",
  },
  {
    id: 3,
    name: "Emma Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
    lastMessage: "Thanks for the quick response! I'll send the payment today.",
    time: "3 hours ago",
    unread: 0,
    listing: "Designer Handbag",
    listingImage: "https://picsum.photos/seed/handbag/40/40",
  },
  {
    id: 4,
    name: "Alex Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    lastMessage: "Would you accept $150 for the gaming chair?",
    time: "Yesterday",
    unread: 0,
    listing: "Gaming Chair RGB",
    listingImage: "https://picsum.photos/seed/chair/40/40",
  },
  {
    id: 5,
    name: "Lisa Park",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
    lastMessage: "The item is exactly as described. Thank you!",
    time: "2 days ago",
    unread: 0,
    listing: "Mountain Bike",
    listingImage: "https://picsum.photos/seed/bike/40/40",
  },
];

export default function InboxScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all");

  const unreadCount = dummyConversations.filter((c) => c.unread > 0).length;
  const conversations =
    selectedTab === "unread"
      ? dummyConversations.filter((c) => c.unread > 0)
      : dummyConversations;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
          activeOpacity={Interactions.buttonOpacity}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Inbox</Text>
      </View>
      <InboxTabs
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        unreadCount={unreadCount}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <ConversationList
          conversations={conversations}
          onPressConversation={(id: number) => console.log("Open chat", id)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    // borderBottomWidth: 1,
    // borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    marginRight: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },

  scrollView: { flex: 1 },
});
