import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "../../src/constants/theme";
import DealRoomList from "../../src/features/dealRooms/components/DealRoomList";
import InboxTabs from "../../src/features/inbox/components/InboxTabs";
import { selectDealRooms, selectIsDealRoomsLoading } from "../../src/features/dealRooms/dealRoomSelectors";
import { fetchDealRooms } from "../../src/features/dealRooms/dealRoomSlice";
import { DealRoom } from "../../src/features/dealRooms/types/dealRoom";
import { ThemedView } from "../../src/components/ThemedView";
import {
  GlobalThemeWrapper,
  ThemedText,
} from "../../src/components/GlobalThemeComponents";
import { useTheme } from "../../src/contexts/ThemeContext";

// Define styles outside component
const baseStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  listContainer: { 
    flex: 1,
  },
});

export default function InboxScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);

  // Create dynamic styles with insets
  const styles = {
    ...baseStyles,
    listContainer: {
      ...baseStyles.listContainer,
      paddingBottom: 20 + insets.bottom,
    },
  };

  // Redux state
  const dealRooms = useSelector(selectDealRooms) as DealRoom[];
  const isLoading = useSelector(selectIsDealRoomsLoading) as boolean;

  // Fetch deal rooms on component mount
  useEffect(() => {
    dispatch(fetchDealRooms({} as any) as any);
  }, [dispatch]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchDealRooms({} as any) as any);
    } catch (error) {
      console.error("Failed to refresh deal rooms:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const unreadCount = dealRooms.filter(
    (dealRoom: DealRoom) => (dealRoom.unread_count || 0) > 0
  ).length;
  const conversations =
    selectedTab === "unread"
      ? dealRooms.filter((dealRoom: DealRoom) => (dealRoom.unread_count || 0) > 0)
      : dealRooms;

  
  return (
    <GlobalThemeWrapper useFullPage={true}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
          <ThemedText type="heading" style={styles.title}>
            Inbox
          </ThemedText>
        </View>

        <InboxTabs
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          unreadCount={unreadCount}
        />
      </View>

      <View style={styles.listContainer}>
        <DealRoomList
          onDealRoomPress={(dealRoom: DealRoom) =>
            router.push(`/deal-room/${dealRoom.id}` as any)
          }
          state={selectedTab === "unread" ? "unread" : undefined}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </GlobalThemeWrapper>
  );
}
