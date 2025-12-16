import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import {
  Shield,
  Star,
  CheckCircle,
  MessageCircle,
  Award,
} from "lucide-react-native";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface SellerBadgeProps {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  totalReviews: number;
  totalListings: number;
  memberSince: string;
  verified: boolean;
  topSeller: boolean;
  responseRate: string;
  onPress?: () => void;
}

export default function SellerBadge({
  id,
  name,
  avatar,
  rating,
  totalReviews,
  totalListings,
  memberSince,
  verified,
  topSeller,
  responseRate,
  onPress,
}: SellerBadgeProps) {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.badgeContainer}>
            {verified && (
              <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                <Shield size={12} color="#fff" />
              </View>
            )}
            {topSeller && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <Award size={12} color="#fff" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <ThemedText type="body" style={styles.name}>{name}</ThemedText>
            {verified && (
              <View style={styles.verifiedText}>
                <CheckCircle size={14} color={theme.colors.accent} />
                <ThemedText type="caption" style={[styles.verifiedLabel, { color: theme.colors.accent }]}>Verified</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <Star size={14} color={theme.colors.accent} fill={theme.colors.accent} />
            <ThemedText type="caption" style={styles.rating}>{rating}</ThemedText>
            <ThemedText type="caption" style={styles.reviews}>({totalReviews} reviews)</ThemedText>
          </View>

          <ThemedText type="caption" style={styles.memberSince}>Member since {memberSince}</ThemedText>
        </View>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.statItem}>
          <ThemedText type="body" style={styles.statValue}>{totalListings}</ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>Listings</ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <ThemedText type="body" style={styles.statValue}>{rating}</ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>Rating</ThemedText>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <ThemedText type="body" style={styles.statValue}>{responseRate}</ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>Response</ThemedText>
        </View>
      </View>

      <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.colors.primary }]}>
        <MessageCircle size={16} color="#fff" />
        <Text style={[styles.contactBtnText, { color: '#fff' }]}>Contact</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  profileContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  badgeContainer: {
    position: "absolute",
    bottom: -4,
    right: -4,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  infoContainer: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  verifiedText: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedLabel: {
    fontSize: 12,
    marginLeft: 2,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    color: '#fff',
  },
});
