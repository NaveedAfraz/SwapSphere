import React from "react";
import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { Star, Quote } from "lucide-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

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

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <ThemedText type="heading" style={styles.title}>Recent Reviews</ThemedText>
        <ThemedText type="caption" style={styles.subtitle}>What our users are saying</ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {reviews.map((review) => (
          <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.reviewHeader}>
              <View style={styles.userContainer}>
                <Image source={{ uri: review.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <ThemedText type="body" style={styles.userName}>{review.name}</ThemedText>
                  <ThemedText type="caption" style={styles.listingName}>{review.listing}</ThemedText>
                </View>
              </View>

              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={12}
                    color={index < review.rating ? theme.colors.accent : theme.colors.border}
                    fill={index < review.rating ? theme.colors.accent : "transparent"}
                  />
                ))}
              </View>
            </View>

            <View style={styles.commentContainer}>
              <Quote size={16} color={theme.colors.primary} style={styles.quoteIcon} />
              <ThemedText type="caption" style={styles.comment}>{review.comment}</ThemedText>
            </View>

            <ThemedText type="caption" style={styles.date}>{review.date}</ThemedText>
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
    marginBottom: 4,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
  },

  carouselContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  reviewCard: {
    width: 280,
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
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
    marginBottom: 2,
  },

  listingName: {
    fontSize: 12,
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
    paddingLeft: 12,
  },

  date: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
});
