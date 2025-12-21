import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { PullToRefresh } from "../../../components/PullToRefresh";
import { SimpleDropdown } from "@/src/components/SimpleDropdown";
import { MessageModal } from "@/src/components/MessageModal";
import { getIntentsThunk, deleteIntentThunk } from "@/src/features/intents/intentThunks";
import {
  selectIntents,
  selectIntentStatus,
  selectIntentError,
} from "@/src/features/intents/intentSlice";
import type { Intent } from "@/src/features/intents/types/intent";

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "#10B981";
    case "matched":
      return "#3B82F6";
    case "closed":
      return "#6B7280";
    default:
      return "#6B7280";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "open":
      return "Active";
    case "matched":
      return "Matched";
    case "closed":
      return "Closed";
    default:
      return "Unknown";
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "electronics":
      return "phone-portrait";
    case "fashion":
      return "shirt";
    case "home":
      return "home";
    case "sports":
      return "basketball";
    case "books":
      return "book";
    case "toys":
      return "game-controller";
    case "automotive":
      return "car";
    case "health":
      return "medical";
    default:
      return "grid";
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays === 7) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function MyIntents() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "matched" | "closed">("all");
  const [messageModal, setMessageModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: 'info' as 'error' | 'success' | 'info',
    onConfirm: undefined as (() => void) | undefined,
    showCancel: false,
  });
  const router = useRouter();
  const { theme } = useTheme();

  const showMessage = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info', onConfirm?: () => void, showCancel = false) => {
    setMessageModal({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      showCancel,
    });
  };

  const closeMessageModal = () => {
    setMessageModal({
      visible: false,
      title: "",
      message: "",
      type: 'info',
      onConfirm: undefined,
      showCancel: false,
    });
  };

  // Redux state
  const dispatch = useDispatch();
  const intents = useSelector(selectIntents);
  const intentStatus = useSelector(selectIntentStatus);
  const intentError = useSelector(selectIntentError);

  // Fetch intents on component mount
  useEffect(() => {
    dispatch(getIntentsThunk({ page: 1, limit: 20 }) as any);
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (intentError) {
      showMessage("Error", intentError, 'error');
    }
  }, [intentError]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(getIntentsThunk({ page: 1, limit: 20 }) as any);
    } catch (error: any) {
      // Error refreshing intents
    } finally {
      setRefreshing(false);
    }
  };

  const handleIntentPress = (intent: any) => {
    // Handle intent press
  };

  const handleEditIntent = (intent: Intent) => {
    router.push(`/create-intent?id=${intent.id}`);
  };

  const handleDeleteIntent = (intent: Intent) => {
    showMessage(
      "Delete Request",
      "Are you sure you want to delete this buyer request? This action cannot be undone.",
      'error',
      () => confirmDeleteIntent(intent),
      true
    );
  };

  const confirmDeleteIntent = async (intent: Intent) => {
    try {
      await dispatch(deleteIntentThunk(intent.id) as any);
      showMessage("Success", "Request deleted successfully", 'success');
    } catch (error) {
      showMessage("Error", "Failed to delete request", 'error');
    }
  };

  const renderIntent = ({ item }: { item: Intent }) => {
    const categoryIcon = getCategoryIcon(item.category);
    
    return (
      <TouchableOpacity
        style={[styles.intentCard, { backgroundColor: theme.colors.surface }]}
        activeOpacity={Interactions.activeOpacity}
        onPress={() => handleIntentPress(item)}
      >
        <View style={styles.intentHeader}>
          <View style={styles.intentIconContainer}>
            <Ionicons 
              name={categoryIcon as any} 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.intentContent}>
            <ThemedText type="body" style={styles.intentTitle}>
              {item.title}
            </ThemedText>
            <ThemedText type="subheading" style={[styles.intentPrice, { color: theme.colors.primary }]}>
              Up to ${item.max_price}
            </ThemedText>
          </View>
          <SimpleDropdown
            items={[
              {
                id: 'edit',
                title: 'Edit',
                icon: 'create-outline',
                onPress: () => handleEditIntent(item),
              },
              {
                id: 'delete',
                title: 'Delete',
                icon: 'trash-outline',
                onPress: () => handleDeleteIntent(item),
                isDestructive: true,
              },
            ]}
          />
        </View>
        
        <ThemedText type="caption" style={styles.intentDescription}>
          {item.description}
        </ThemedText>
        
        <View style={styles.intentStats}>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={14} color={theme.colors.secondary} />
            <ThemedText type="caption" style={styles.statText}>{item.deal_rooms_count || 0}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.secondary} />
            <ThemedText type="caption" style={styles.statText}>{formatDate(item.created_at)}</ThemedText>
          </View>
        </View>
        
        <View style={styles.intentFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={theme.colors.secondary} />
            <ThemedText type="caption" style={styles.locationText}>
              {item.location.city}{item.location.state ? `, ${item.location.state}` : ''}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText type="caption" style={styles.statusText}>
              {getStatusText(item.status)}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredIntents = intents.filter(intent => 
    selectedFilter === "all" || intent.status === selectedFilter
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {(["all", "active", "matched", "closed"] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              { backgroundColor: selectedFilter === filter ? theme.colors.primary : theme.colors.background }
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={Interactions.buttonOpacity}
          >
            <ThemedText
              type="caption"
              style={[
                styles.filterText,
                selectedFilter === filter && { color: "#FFFFFF" }
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <FlatList
          data={filteredIntents}
          renderItem={renderIntent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.colors.border} />
              <ThemedText type="subheading" style={styles.emptyText}>No buyer requests found</ThemedText>
              <ThemedText type="body" style={styles.emptySubtext}>
                Start by creating your first buyer request
              </ThemedText>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push("/create-intent")}
                activeOpacity={0.9}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <ThemedText type="caption" style={styles.createButtonText}>Create Request</ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      </PullToRefresh>
      
      <MessageModal
        visible={messageModal.visible}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
        onConfirm={messageModal.onConfirm}
        showCancel={messageModal.showCancel}
        onClose={closeMessageModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
  },
  intentCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  intentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  intentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  intentContent: {
    flex: 1,
  },
  intentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  intentPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  intentDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  intentStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
  },
  intentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
    textAlign: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
