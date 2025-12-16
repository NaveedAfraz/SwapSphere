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
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import {
  fetchMyReviewsThunk,
  fetchReceivedReviewsThunk,
} from "../../review/reviewThunks";
import {
  selectMyReviews,
  selectReceivedReviews,
  selectReviewStatus,
} from "../../review/reviewSelectors";
import type { Review } from "../../review/types/review";

const renderStars = (rating: number, size = 16, theme: any) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? "star" : "star-outline"}
        size={size}
        color={star <= rating ? theme.colors.warning : theme.colors.border}
      />
    ))}
  </View>
);
// Mock data commented out - now using Redux state
// const mockReviews: Review[] = [
//   {
//     id: "1",
//     reviewer: {
//       name: "Sarah Johnson",
//       avatar:
//         "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
//       rating: 4.8,
//     },
//     item: "iPhone 13 Pro - Excellent Condition",
//     rating: 5,
//     comment:
//       "Perfect condition! Exactly as described. Fast shipping and great communication.",
//     date: "2 days ago",
//     response: "Thank you so much! Glad you're happy with your purchase.",
//     isSellerReview: true,
//   },
//   {
//     id: "2",
//     reviewer: {
//       name: "Mike Chen",
//       avatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
//       rating: 4.9,
//     },
//     item: "MacBook Air M1 - 2020",
//     rating: 4,
//     comment: "Good laptop, minor scratches as mentioned. Works perfectly.",
//     date: "1 week ago",
//     isSellerReview: true,
//   },
//   {
//     id: "3",
//     reviewer: {
//       name: "Emily Davis",
//       avatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
//       rating: 4.7,
//     },
//     item: "Vintage Camera Collection",
//     rating: 5,
//     comment:
//       "Amazing collection! Each piece was carefully packaged and in great condition.",
//     date: "2 weeks ago",
//     isSellerReview: false,
//   },
// ];

export default function MyReviews({
  isSellerMode = true,
}: {
  isSellerMode?: boolean;
}) {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "5" | "4" | "3" | "2" | "1"
  >("all");
  const { theme } = useTheme();

  // Redux integration
  const dispatch = useDispatch();
  const myReviews = useSelector(selectMyReviews);
  const receivedReviews = useSelector(selectReceivedReviews);
  const reviewStatus = useSelector(selectReviewStatus);

  // Fetch reviews on component mount
  useEffect(() => {
    if (isSellerMode) {
      dispatch(fetchReceivedReviewsThunk({ page: 1, limit: 20 }) as any);
    } else {
      dispatch(fetchMyReviewsThunk({ page: 1, limit: 20 }) as any);
    }
  }, [dispatch, isSellerMode]);

  const reviews = isSellerMode ? receivedReviews : myReviews;
  const filteredReviews = (reviews || []).filter((r: Review) => {
    if (selectedFilter === "all") return true;
    return r.rating === Number(selectedFilter);
  });

  const renderReview = ({ item }: { item: Review }) => (
    <View
      style={[
        styles.reviewCard,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.primary,
        },
      ]}
    >
      <View style={styles.reviewHeader}>
        <Image
          source={{
            uri: item.reviewer_avatar || "https://via.placeholder.com/40",
          }}
          style={styles.reviewerAvatar}
        />
        <View style={styles.reviewerInfo}>
          <ThemedText type="body" style={styles.reviewerName}>
            {item.reviewer_name || "Anonymous"}
          </ThemedText>
          {renderStars(5, 14, theme)}{" "}
          {/* Reviewer rating not available in Review type */}
        </View>
        <ThemedText type="caption" style={styles.reviewDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </ThemedText>
      </View>

      <ThemedText type="caption" style={styles.reviewedItem}>
        {item.listing_title || "Unknown Item"}
      </ThemedText>

      <View style={styles.ratingContainer}>
        {renderStars(item.rating, 16, theme)}
        <ThemedText type="body" style={styles.ratingText}>
          {item.rating}.0
        </ThemedText>
      </View>

      <ThemedText type="body" style={styles.reviewComment}>
        {item.comment}
      </ThemedText>

      {item.response && (
        <View
          style={[
            styles.responseContainer,
            {
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <ThemedText type="caption" style={styles.responseLabel}>
            Your Response
          </ThemedText>
          <ThemedText type="body" style={styles.responseText}>
            {item.response.comment}
          </ThemedText>
        </View>
      )}

      {isSellerMode && !item.response && (
        <TouchableOpacity
          style={[
            styles.respondButton,
            { backgroundColor: theme.colors.primary },
          ]}
          activeOpacity={Interactions.buttonOpacity}
        >
          <ThemedText type="body" style={styles.respondButtonText}>
            Respond
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  // Calculate stats from real data
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  const positivePercentage =
    reviews.length > 0
      ? Math.round(
          (reviews.filter((r: Review) => r.rating >= 4).length /
            reviews.length) *
            100
        )
      : 0;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.statsContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.statItem}>
          <ThemedText type="heading" style={styles.statValue}>
            {averageRating}
          </ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>
            Average Rating
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText type="heading" style={styles.statValue}>
            {reviews.length}
          </ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>
            Total Reviews
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText type="heading" style={styles.statValue}>
            {positivePercentage}%
          </ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>
            Positive
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.filterContainer,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          },
        ]}
      >
        {(["all", "5", "4", "3", "2", "1"] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && [
                styles.filterChipActive,
                { backgroundColor: theme.colors.primary },
              ],
              { backgroundColor: theme.colors.border },
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={Interactions.buttonOpacity}
          >
            {filter === "all" ? (
              <ThemedText
                type="caption"
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && [
                    styles.filterChipTextActive,
                    { color: theme.colors.surface },
                  ],
                ]}
              >
                All
              </ThemedText>
            ) : (
              <View style={styles.starFilter}>
                <Ionicons
                  name="star"
                  size={12}
                  color={
                    selectedFilter === filter
                      ? theme.colors.surface
                      : theme.colors.warning
                  }
                />
                <ThemedText
                  type="caption"
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter && [
                      styles.filterChipTextActive,
                      { color: theme.colors.surface },
                    ],
                  ]}
                >
                  {filter}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="star-outline"
              size={48}
              color={theme.colors.secondary}
            />
            <ThemedText type="body" style={styles.emptyText}>
              {isSellerMode
                ? "No reviews received yet"
                : "No reviews given yet"}
            </ThemedText>
            <ThemedText type="caption" style={styles.emptySubtext}>
              {isSellerMode
                ? "Start making great sales to earn reviews from buyers"
                : "Start making purchases and leave reviews for sellers"}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsContainer: {
    flexDirection: "row",
    paddingVertical: 20,
    borderBottomWidth: 1,
  },

  statItem: { flex: 1, alignItems: "center" },

  statValue: { fontSize: 24, fontWeight: "700" },

  statLabel: { fontSize: 12, marginTop: 4 },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },

  filterChipActive: {},

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  filterChipTextActive: {},

  starFilter: { flexDirection: "row", alignItems: "center" },

  listContainer: { padding: 20 },

  reviewCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },

  reviewerInfo: { flex: 1 },

  reviewerName: { fontSize: 16, fontWeight: "600" },

  reviewDate: { fontSize: 12 },

  reviewedItem: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: "italic",
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  starContainer: { flexDirection: "row" },

  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  responseContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },

  responseLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },

  responseText: { fontSize: 14, lineHeight: 18 },

  respondButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    marginTop: 8,
  },

  respondButtonText: { fontSize: 14, fontWeight: "600" },

  // Empty state styles
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },
});
