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
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.badgeContainer}>
            {verified && (
              <View style={[styles.badge, styles.verified]}>
                <Shield size={12} color="#fff" />
              </View>
            )}
            {topSeller && (
              <View style={[styles.badge, styles.topSeller]}>
                <Award size={12} color="#fff" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{name}</Text>
            {verified && (
              <View style={styles.verifiedText}>
                <CheckCircle size={14} color="#22C55E" />
                <Text style={styles.verifiedLabel}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.reviews}>({totalReviews} reviews)</Text>
          </View>

          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalListings}</Text>
          <Text style={styles.statLabel}>Listings</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{responseRate}</Text>
          <Text style={styles.statLabel}>Response</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>24h</Text>
          <Text style={styles.statLabel}>Avg. Reply</Text>
        </View>
      </View>

      {/* <TouchableOpacity style={styles.contactBtn} activeOpacity={Interactions.buttonOpacity}>
        <MessageCircle size={16} color="#fff" />
        <Text style={styles.contactBtnText}>Contact Seller</Text>
      </TouchableOpacity> */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
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
  verified: {
    backgroundColor: "#22C55E",
  },
  topSeller: {
    backgroundColor: "#FACC15",
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
    color: "#111827",
    marginRight: 8,
  },
  verifiedText: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedLabel: {
    fontSize: 12,
    color: "#22C55E",
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
    color: "#111827",
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  memberSince: {
    fontSize: 12,
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: "#D1D5DB",
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    width: 1,
    backgroundColor: "#F3F4F6",
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 10,
  },
  contactBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
