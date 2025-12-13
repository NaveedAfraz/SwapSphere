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

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  success: "#22C55E",
  warning: "#FACC15",
  error: "#DC2626",
  gold: "#FACC15",
  chipBg: "#F3F4F6",
};

interface Sale {
  id: string;
  item: {
    title: string;
    image: string;
    price: number;
  };
  buyer: {
    name: string;
    avatar: string;
    rating: number;
  };
  saleDate: string;
  status: "completed" | "pending" | "disputed";
  paymentStatus: "paid" | "pending" | "refunded";
  shippingStatus?: "shipped" | "processing" | "delivered";
}

const mockSales: Sale[] = [
  {
    id: "1",
    item: {
      title: "iPhone 13 Pro - Excellent Condition",
      image:
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
      price: 899,
    },
    buyer: {
      name: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
      rating: 4.8,
    },
    saleDate: "2024-01-15",
    status: "completed",
    paymentStatus: "paid",
    shippingStatus: "delivered",
  },
  {
    id: "2",
    item: {
      title: "MacBook Air M1 - 2020",
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      price: 799,
    },
    buyer: {
      name: "Mike Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      rating: 4.9,
    },
    saleDate: "2024-01-18",
    status: "pending",
    paymentStatus: "paid",
    shippingStatus: "processing",
  },
  {
    id: "3",
    item: {
      title: "AirPods Pro - Like New",
      image:
        "https://images.unsplash.com/photo-1606214174585-fe25d285063f?w=400",
      price: 179,
    },
    buyer: {
      name: "Emily Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
      rating: 4.7,
    },
    saleDate: "2024-01-20",
    status: "disputed",
    paymentStatus: "pending",
    shippingStatus: "shipped",
  },
];

const getStatusColor = (status: Sale["status"]) =>
  status === "completed"
    ? COLORS.success
    : status === "pending"
    ? COLORS.warning
    : COLORS.error;

const getPaymentStatusColor = (status: Sale["paymentStatus"]) =>
  status === "paid"
    ? COLORS.success
    : status === "pending"
    ? COLORS.warning
    : COLORS.error;

const getShippingStatusColor = (status?: Sale["shippingStatus"]) => {
  if (!status) return COLORS.muted;
  return status === "delivered"
    ? COLORS.success
    : status === "shipped"
    ? COLORS.accent
    : COLORS.warning;
};

const renderStars = (rating: number, size = 14) => (
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

export default function Sales() {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "completed" | "pending" | "disputed"
  >("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const filteredSales = mockSales.filter(
    (s) => selectedFilter === "all" || s.status === selectedFilter
  );

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => setShowDetails(showDetails === item.id ? null : item.id)}
      activeOpacity={0.9}
    >
      <View style={styles.saleHeader}>
        <Image source={{ uri: item.item.image }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.item.title}
          </Text>
          <Text style={styles.itemPrice}>${item.item.price}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.badge,
                { backgroundColor: getPaymentStatusColor(item.paymentStatus) },
              ]}
            >
              <Text style={styles.badgeText}>
                {item.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buyerInfo}>
        <Image source={{ uri: item.buyer.avatar }} style={styles.buyerAvatar} />
        <View style={styles.buyerDetails}>
          <Text style={styles.buyerName}>{item.buyer.name}</Text>
          {renderStars(item.buyer.rating)}
        </View>
        <Text style={styles.saleDate}>{item.saleDate}</Text>
      </View>

      {showDetails === item.id && (
        <View style={styles.expandedDetails}>
          {item.shippingStatus && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shipping</Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: getShippingStatusColor(
                      item.shippingStatus
                    ),
                  },
                ]}
              >
                <Text style={styles.badgeText}>
                  {item.shippingStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            {item.status === "pending" && (
              <>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={COLORS.accent}
                  />
                  <Text style={styles.actionText}>Track</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={COLORS.accent}
                  />
                  <Text style={styles.actionText}>Message</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === "completed" && (
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={COLORS.accent}
                />
                <Text style={styles.actionText}>Sell Again</Text>
              </TouchableOpacity>
            )}
            {item.status === "disputed" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.disputeButton]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={[styles.actionText, { color: COLORS.white }]}>
                  Resolve
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>$1,877</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(["all", "completed", "pending", "disputed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              selectedFilter === f && styles.filterActive,
            ]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === f && styles.filterTextActive,
              ]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredSales}
        renderItem={renderSale}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 20 }}
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

  stat: { flex: 1, alignItems: "center" },

  statValue: { fontSize: 22, fontWeight: "700", color: COLORS.dark },

  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 4 },

  filterContainer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.chipBg,
  },

  filterActive: { backgroundColor: COLORS.dark },

  filterText: { fontSize: 12, fontWeight: "600", color: COLORS.muted },

  filterTextActive: { color: COLORS.white },

  saleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  saleHeader: { flexDirection: "row", marginBottom: 12 },

  itemImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },

  itemInfo: { flex: 1 },

  itemTitle: { fontSize: 16, fontWeight: "600", color: COLORS.dark },

  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent,
    marginTop: 4,
  },

  statusRow: { flexDirection: "row", gap: 8, marginTop: 8 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  badgeText: { fontSize: 10, fontWeight: "700", color: COLORS.white },

  buyerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },

  buyerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },

  buyerDetails: { flex: 1 },

  buyerName: { fontSize: 14, fontWeight: "600", color: COLORS.dark },

  saleDate: { fontSize: 12, color: COLORS.muted },

  starContainer: { flexDirection: "row" },

  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  detailLabel: { fontSize: 14, fontWeight: "600", color: COLORS.dark },

  actionButtons: { flexDirection: "row", gap: 12 },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.surface,
    flex: 1,
  },

  actionText: { fontSize: 12, fontWeight: "600", color: COLORS.accent },

  disputeButton: { backgroundColor: COLORS.error, borderColor: COLORS.error },
});
