import React from "react";
import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { Star, Quote } from "lucide-react-native";

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  listing: string;
}

interface ReviewsCarouselProps {
  reviews: Review[];
}

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  gold: "#FACC15",
};

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Reviews</Text>
        <Text style={styles.subtitle}>What our users are saying</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.userContainer}>
                <Image source={{ uri: review.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{review.name}</Text>
                  <Text style={styles.listingName}>{review.listing}</Text>
                </View>
              </View>

              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={12}
                    color={index < review.rating ? COLORS.gold : COLORS.surface}
                    fill={index < review.rating ? COLORS.gold : "transparent"}
                  />
                ))}
              </View>
            </View>

            <View style={styles.commentContainer}>
              <Quote size={16} color={COLORS.accent} style={styles.quoteIcon} />
              <Text style={styles.comment} numberOfLines={4}>
                {review.comment}
              </Text>
            </View>

            <Text style={styles.date}>{review.date}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 20,
    // paddingBottom: 100,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 4,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },

  carouselContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  reviewCard: {
    width: 280,
    backgroundColor: COLORS.white,
    borderRadius: 20,

    padding: 16,
    marginRight: 16,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 2,
  },

  listingName: {
    fontSize: 12,
    color: COLORS.muted,
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  commentContainer: {
    position: "relative",
    marginBottom: 12,
  },

  quoteIcon: {
    position: "absolute",
    top: -8,
    left: -4,
    opacity: 0.25,
  },

  comment: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.dark,
    paddingLeft: 12,
  },

  date: {
    fontSize: 11,
    color: COLORS.muted,
    alignSelf: "flex-end",
  },
});
