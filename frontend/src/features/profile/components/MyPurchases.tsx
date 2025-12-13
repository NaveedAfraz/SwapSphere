import React, { useState } from "react";
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

interface Purchase {
  id: string;
  item: {
    title: string;
    image: string;
    price: number;
    condition: string;
  };
  seller: {
    name: string;
    avatar: string;
    rating: number;
  };
  purchaseDate: string;
  status: "delivered" | "shipping" | "processing" | "cancelled";
  paymentStatus: "paid" | "pending" | "refunded";
  trackingNumber?: string;
  estimatedDelivery?: string;
}

const getStatusColor = (status: Purchase["status"]) => {
  switch (status) {
    case "delivered":
      return COLORS.success;
    case "shipping":
      return COLORS.accent;
    case "processing":
      return COLORS.gold;
    case "cancelled":
      return COLORS.error;
    default:
      return COLORS.muted;
  }
};

const getPaymentStatusColor = (status: Purchase["paymentStatus"]) => {
  switch (status) {
    case "paid":
      return COLORS.success;
    case "pending":
      return COLORS.gold;
    case "refunded":
      return COLORS.error;
    default:
      return COLORS.muted;
  }
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

export default function MyPurchases() {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "delivered" | "shipping" | "processing" | "cancelled"
  >("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const mockPurchases: Purchase[] = [
    {
      id: "1",
      item: {
        title: "Vintage Leather Jacket",
        image:
          "https://images.unsplash.com/photo-1551488831-00ddc6d65544?w=400",
        price: 189,
        condition: "Excellent",
      },
      seller: {
        name: "Alex Vintage",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        rating: 4.9,
      },
      purchaseDate: "2024-01-18",
      status: "delivered",
      paymentStatus: "paid",
      trackingNumber: "1Z999AA10123456784",
      estimatedDelivery: "2024-01-20",
    },
    {
      id: "2",
      item: {
        title: "Canon EOS Rebel T7i",
        image:
          "https://images.unsplash.com/photo-1516035069379-859e2e5d5d7c?w=400",
        price: 549,
        condition: "Like New",
      },
      seller: {
        name: "Photo Pro Store",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
        rating: 4.8,
      },
      purchaseDate: "2024-01-20",
      status: "shipping",
      paymentStatus: "paid",
      trackingNumber: "1Z999AA10123456785",
      estimatedDelivery: "2024-01-25",
    },
    {
      id: "3",
      item: {
        title: "Gaming PC Setup",
        image:
          "https://images.unsplash.com/photo-1597872200968-1b80694e5c71?w=400",
        price: 1200,
        condition: "Good",
      },
      seller: {
        name: "TechGuru",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
        rating: 4.7,
      },
      purchaseDate: "2024-01-22",
      status: "processing",
      paymentStatus: "pending",
    },
  ];

  const filteredPurchases = mockPurchases.filter(
    (p) => selectedFilter === "all" || p.status === selectedFilter
  );

  const renderPurchase = ({ item }: { item: Purchase }) => (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => setShowDetails(showDetails === item.id ? null : item.id)}
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.purchaseHeader}>
        <Image source={{ uri: item.item.image }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.item.title}</Text>
          <Text style={styles.itemPrice}>${item.item.price}</Text>
          <Text style={styles.itemCondition}>
            {item.item.condition} Condition
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getPaymentStatusColor(item.paymentStatus) },
              ]}
            >
              <Text style={styles.statusText}>
                {item.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sellerInfo}>
        <Image
          source={{ uri: item.seller.avatar }}
          style={styles.sellerAvatar}
        />
        <View style={styles.sellerDetails}>
          <Text style={styles.sellerName}>{item.seller.name}</Text>
          {renderStars(item.seller.rating)}
        </View>
        <Text style={styles.purchaseDate}>{item.purchaseDate}</Text>
      </View>

      {showDetails === item.id && (
        <View style={styles.expandedDetails}>
          {item.trackingNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tracking</Text>
              <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={COLORS.accent}
              />
              <Text style={styles.actionButtonText}>Contact Seller</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPurchases}
        renderItem={renderPurchase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  purchaseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  purchaseHeader: { flexDirection: "row", marginBottom: 12 },

  itemImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },

  itemInfo: { flex: 1 },

  itemTitle: { fontSize: 16, fontWeight: "600", color: COLORS.dark },

  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent,
    marginTop: 4,
  },

  itemCondition: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

  statusRow: { flexDirection: "row", gap: 8, marginTop: 8 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  statusText: { fontSize: 10, fontWeight: "700", color: COLORS.white },

  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },

  sellerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },

  sellerDetails: { flex: 1 },

  sellerName: { fontSize: 14, fontWeight: "600", color: COLORS.dark },

  purchaseDate: { fontSize: 12, color: COLORS.muted },

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
    marginBottom: 8,
  },

  detailLabel: { fontSize: 13, fontWeight: "600", color: COLORS.dark },

  trackingNumber: { fontSize: 13, color: COLORS.accent },

  actionButtons: { flexDirection: "row", marginTop: 8 },

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

  actionButtonText: { fontSize: 12, fontWeight: "600", color: COLORS.accent },
});
