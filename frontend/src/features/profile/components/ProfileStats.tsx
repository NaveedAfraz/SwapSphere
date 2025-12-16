import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface ProfileStatsProps {
  totalListings: number;
  totalReviews: number;
  rating: number;
}

export default function ProfileStats({
  totalListings,
  totalReviews,
  rating,
}: ProfileStatsProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.statsSection,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.statItem}>
        <ThemedText type="heading" style={styles.statNumber}>
          {totalListings}
        </ThemedText>
        <ThemedText type="caption" style={styles.statLabel}>
          Listings
        </ThemedText>
      </View>
      <View
        style={[styles.statDivider, { backgroundColor: theme.colors.border }]}
      />
      <View style={styles.statItem}>
        <ThemedText type="heading" style={styles.statNumber}>
          {totalReviews}
        </ThemedText>
        <ThemedText type="caption" style={styles.statLabel}>
          Reviews
        </ThemedText>
      </View>
      <View
        style={[styles.statDivider, { backgroundColor: theme.colors.border }]}
      />
      <View style={styles.statItem}>
        <ThemedText type="heading" style={styles.statNumber}>
          {rating}
        </ThemedText>
        <ThemedText type="caption" style={styles.statLabel}>
          Rating
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingVertical: 20,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
  },
});
