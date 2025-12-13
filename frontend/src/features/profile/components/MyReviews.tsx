import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from '@/src/constants/theme';

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  success: "#22C55E",
  error: "#DC2626",
  gold: "#FACC15",
  chipBg: "#F3F4F6",
};

interface Review {
  id: string;
  reviewer: {
    name: string;
    avatar: string;
    rating: number;
  };
  item: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
  isSellerReview: boolean;
}

const renderStars = (rating: number, size = 16) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? "star" : "star-outline"}
        size={size}
        color={star <= rating ? COLORS.gold : COLORS.surface}
      />
    ))}
  </View>
);
const mockReviews: Review[] = [
  {
    id: "1",
    reviewer: {
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
      rating: 4.8,
    },
    item: "iPhone 13 Pro - Excellent Condition",
    rating: 5,
    comment:
      "Perfect condition! Exactly as described. Fast shipping and great communication.",
    date: "2 days ago",
    response: "Thank you so much! Glad you're happy with your purchase.",
    isSellerReview: true,
  },
  {
    id: "2",
    reviewer: {
      name: "Mike Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      rating: 4.9,
    },
    item: "MacBook Air M1 - 2020",
    rating: 4,
    comment: "Good laptop, minor scratches as mentioned. Works perfectly.",
    date: "1 week ago",
    isSellerReview: true,
  },
  {
    id: "3",
    reviewer: {
      name: "Emily Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      rating: 4.7,
    },
    item: "Vintage Camera Collection",
    rating: 5,
    comment:
      "Amazing collection! Each piece was carefully packaged and in great condition.",
    date: "2 weeks ago",
    isSellerReview: false,
  },
];
export default function MyReviews({
  isSellerMode = true,
}: {
  isSellerMode?: boolean;
}) {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "5" | "4" | "3" | "2" | "1"
  >("all");

  const filteredReviews = mockReviews.filter((r) => {
    if (r.isSellerReview !== isSellerMode) return false;
    if (selectedFilter === "all") return true;
    return r.rating === Number(selectedFilter);
  });

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: item.reviewer.avatar }}
          style={styles.reviewerAvatar}
        />
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName}>{item.reviewer.name}</Text>
          {renderStars(item.reviewer.rating, 14)}
        </View>
        <Text style={styles.reviewDate}>{item.date}</Text>
      </View>

      <Text style={styles.reviewedItem}>{item.item}</Text>

      <View style={styles.ratingContainer}>
        {renderStars(item.rating)}
        <Text style={styles.ratingText}>{item.rating}.0</Text>
      </View>

      <Text style={styles.reviewComment}>{item.comment}</Text>

      {item.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Your Response</Text>
          <Text style={styles.responseText}>{item.response}</Text>
        </View>
      )}

      {isSellerMode && !item.response && (
        <TouchableOpacity style={styles.respondButton} activeOpacity={Interactions.buttonOpacity}>
          <Text style={styles.respondButtonText}>Respond</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Average Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{mockReviews.length}</Text>
          <Text style={styles.statLabel}>Total Reviews</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>98%</Text>
          <Text style={styles.statLabel}>Positive</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(["all", "5", "4", "3", "2", "1"] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={Interactions.buttonOpacity}
          >
            {filter === "all" ? (
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            ) : (
              <View style={styles.starFilter}>
                <Ionicons
                  name="star"
                  size={12}
                  color={selectedFilter === filter ? COLORS.white : COLORS.gold}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter}
                </Text>
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },

  statItem: { flex: 1, alignItems: "center" },

  statValue: { fontSize: 24, fontWeight: "700", color: COLORS.dark },

  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 4 },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.chipBg,
  },

  filterChipActive: { backgroundColor: COLORS.dark },

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginLeft: 4,
  },

  filterChipTextActive: { color: COLORS.white },

  starFilter: { flexDirection: "row", alignItems: "center" },

  listContainer: { padding: 20 },

  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: COLORS.dark,
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

  reviewerName: { fontSize: 16, fontWeight: "600", color: COLORS.dark },

  reviewDate: { fontSize: 12, color: COLORS.muted },

  reviewedItem: {
    fontSize: 14,
    color: COLORS.muted,
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
    color: COLORS.dark,
    marginLeft: 8,
  },

  reviewComment: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: 12,
  },

  responseContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },

  responseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 4,
  },

  responseText: { fontSize: 14, color: COLORS.muted, lineHeight: 18 },

  respondButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    marginTop: 8,
  },

  respondButtonText: { fontSize: 14, fontWeight: "600", color: COLORS.white },
});
