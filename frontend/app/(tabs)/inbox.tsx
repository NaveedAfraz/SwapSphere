import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
import {
  selectChats,
  selectIsChatLoading,
} from "@/src/features/inbox/chatSelectors";
import { fetchChatsThunk } from "@/src/features/inbox/chatThunks";
import { PullToRefresh } from "@/src/components/PullToRefresh";
import { getUserByIdThunk } from "@/src/features/user/userThunks";
import { fetchListingByIdThunk } from "@/src/features/listing/listingThunks";
import { selectUser as selectAuthUser } from "@/src/features/auth/authSelectors";

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
};

export default function InboxScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);

  // Redux state
  const chats = useSelector(selectChats);
  const isLoading = useSelector(selectIsChatLoading);

  // Fetch chats on component mount
  useEffect(() => {
    dispatch(fetchChatsThunk({}) as any);
  }, [dispatch]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchChatsThunk({}) as any);
    } catch (error) {
      console.error("Failed to refresh chats:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Ensure we have display data for each conversation: other user's profile and listing details
  const currentUser = useSelector(selectAuthUser);
  // useEffect(() => {
  //   if (!chats || chats.length === 0) return;

  //   chats.forEach((chat) => {
  //     // try to find the other participant id
  //     const participants = chat.participants || [];
  //     let otherId: string | undefined;
  //     if (participants.length === 1) {
  //       // single participant row may include user_id
  //       otherId =
  //         participants[0]?.user?.id ||
  //         participants[0]?.user_id ||
  //         participants[0]?.participant_id;
  //     } else if (participants.length > 1) {
  //       otherId =
  //         participants.find(
  //           (p: any) => (p.user?.id || p.user_id) !== currentUser?.id
  //         )?.user?.id ||
  //         participants.find(
  //           (p: any) => (p.user?.id || p.user_id) !== currentUser?.id
  //         )?.user_id;
  //     }

  //     if (otherId) {
  //       dispatch(getUserByIdThunk(otherId) as any);
  //     }

  //     const listingId = chat.listing?.id || chat.listing_id;
  //     if (listingId) {
  //       dispatch(fetchListingByIdThunk(listingId) as any);
  //     }
  //   });
  // }, [chats, dispatch, currentUser]);
  console.log("=== InboxScreen Rendered ===");
  console.log("Chats:", chats);
  const unreadCount = chats.filter(
    (chat) => (chat.unread_count || 0) > 0
  ).length;
  const conversations =
    selectedTab === "unread"
      ? chats.filter((chat) => (chat.unread_count || 0) > 0)
      : chats;

  console.log("Filtered conversations:", conversations);
  console.log("Selected tab:", selectedTab);

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

      <PullToRefresh refreshing={refreshing} onRefresh={onRefresh} style={styles.scrollView}>
        <ConversationList
          conversations={conversations}
          onPressConversation={(id: string) =>
            router.push(`/inbox/${id}` as any)
          }
        />
      </PullToRefresh>
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
