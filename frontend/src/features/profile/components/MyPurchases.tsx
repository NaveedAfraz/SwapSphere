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
import { fetchTransactionsThunk } from "../../payment/paymentThunks";
import {
  selectTransactions,
  selectPaymentStatus,
} from "../../payment/paymentSelectors";

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
    "all" | "pending" | "processing" | "completed" | "cancelled"
  >("all");

  // Redux integration using payment thunks/selectors
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const paymentStatus = useSelector(selectPaymentStatus);

  // Fetch transactions on component mount
  useEffect(() => {
    dispatch(fetchTransactionsThunk({ page: 1, limit: 20 }) as any);
  }, [dispatch]);

  // Filter transactions to show only purchases (buyer transactions)
  const purchaseTransactions = (transactions || []).filter(
    (transaction: any) =>
      transaction.type === "purchase" || transaction.buyer_id === "current_user" // Adjust based on actual Transaction type
  );

  const filteredPurchases = purchaseTransactions.filter(
    (transaction: any) =>
      selectedFilter === "all" || transaction.status === selectedFilter
  );

  const [showDetails, setShowDetails] = useState<string | null>(null);

  const renderPurchase = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => setShowDetails(showDetails === item.id ? null : item.id)}
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.purchaseHeader}>
        <Image
          source={{
            uri:
              item.listing?.images?.[0]?.url ||
              "https://via.placeholder.com/64",
          }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {item.listing?.title || "Unknown Item"}
          </Text>
          <Text style={styles.itemPrice}>
            ${item.amount || item.listing?.price || 0}
          </Text>
          <Text style={styles.itemCondition}>
            {item.listing?.condition || "N/A"} Condition
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {(item.status || "").toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getPaymentStatusColor(item.payment_status) },
              ]}
            >
              <Text style={styles.statusText}>
                {(item.payment_status || "").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sellerInfo}>
        <Image
          source={{
            uri: item.seller?.avatar_url || "https://via.placeholder.com/32",
          }}
          style={styles.sellerAvatar}
        />
        <View style={styles.sellerDetails}>
          <Text style={styles.sellerName}>
            {item.seller?.display_name || "Unknown Seller"}
          </Text>
          {renderStars(item.seller?.rating || 0)}
        </View>
        <Text style={styles.purchaseDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {showDetails === item.id && (
        <View style={styles.expandedDetails}>
          {item.tracking_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tracking</Text>
              <Text style={styles.trackingNumber}>{item.tracking_number}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={Interactions.buttonOpacity}
            >
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bag-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No purchases found</Text>
            <Text style={styles.emptySubtext}>Start browsing and making purchases to see them here</Text>
          </View>
        }
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
    color: COLORS.muted,
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },
});
