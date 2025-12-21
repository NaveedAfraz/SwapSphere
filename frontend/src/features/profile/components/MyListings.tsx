import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { fetchMyListingsThunk } from "../../listing/listingThunks";
import {
  selectMyListings,
  selectListingStatus,
} from "../../listing/listingSelectors";
import type { Listing } from "../../listing/types/listing";
import { PullToRefresh } from "../../../components/PullToRefresh";

const getStatusColor = (isPublished: boolean) => {
  return isPublished ? "#10B981" : "#F59E0B";
};

const getStatusText = (isPublished: boolean) => {
  return isPublished ? "Published" : "Draft";
};

export default function MyListings() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "active" | "sold" | "pending"
  >("all");

  // Redux integration using listing thunks/selectors
  const dispatch = useDispatch();
  const myListings = useSelector(selectMyListings);
  const listingsStatus = useSelector(selectListingStatus);
  
  // Fetch listings on component mount
  useEffect(() => {
    dispatch(fetchMyListingsThunk({ page: 1, limit: 20 }) as any);
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchMyListingsThunk({ page: 1, limit: 20 }) as any);
    } catch (error: any) {
      // Error refreshing listings
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleListingPress = (listing: Listing) => {
    router.push(`/product/${listing.id}`);
  };

  const renderListing = ({ item }: { item: Listing }) => {
    // Use primary_image_url from the API response
    const imageUrl = item.primary_image_url || "https://via.placeholder.com/80";

    return (
      <TouchableOpacity
        style={[styles.listingCard, { backgroundColor: theme.colors.surface }]}
        activeOpacity={Interactions.activeOpacity}
        onPress={() => handleListingPress(item)}
      >
        <Image source={{ uri: imageUrl }} style={styles.listingImage} />
        <View style={styles.listingContent}>
          <ThemedText type="body" style={styles.listingTitle}>
            {item.title}
          </ThemedText>
          <ThemedText type="subheading" style={[styles.listingPrice, { color: theme.colors.primary }]}>
            ${item.price}
          </ThemedText>
          <View style={styles.listingStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={theme.colors.secondary} />
              <ThemedText type="caption" style={styles.statText}>{item.view_count}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={14} color={theme.colors.secondary} />
              <ThemedText type="caption" style={styles.statText}>{item.favorites_count}</ThemedText>
            </View>
          </View>
          <View style={styles.listingFooter}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.is_published) }]}>
              <ThemedText type="caption" style={styles.statusText}>
                {getStatusText(item.is_published)}
              </ThemedText>
            </View>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Helper function to format date
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

  const filteredListings = (myListings || [])
    .filter(
      (listing: any) =>
        selectedFilter === "all" || listing.status === selectedFilter
    )
    .filter(
      (listing, index, self) =>
        // Remove duplicates based on listing ID
        index === self.findIndex((l) => l.id === listing.id)
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {(["all", "active", "sold", "pending"] as const).map((filter) => (
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
                selectedFilter === filter 
                  ? { color: "#FFFFFF" } 
                  : { color: theme.colors.secondary }
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <FlatList
          data={filteredListings}
          renderItem={renderListing}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="grid-outline" size={48} color={theme.colors.border} />
              <ThemedText type="subheading" style={styles.emptyText}>No listings found</ThemedText>
              <ThemedText type="body" style={styles.emptySubtext}>
              Start by creating your first listing
              </ThemedText>
            </View>
          }
        />
      </PullToRefresh>
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
  listingCard: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listingContent: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  listingStats: {
    flexDirection: "row",
    marginBottom: 8,
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
  listingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postedTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
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
  },
});
