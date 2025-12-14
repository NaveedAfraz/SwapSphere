import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { Interactions } from '@/src/constants/theme';
import { fetchTransactionsThunk } from '../../payment/paymentThunks';
import { selectTransactions, selectPaymentStatus } from '../../payment/paymentSelectors';
import type { Transaction } from '../../payment/types/payment';

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

const getStatusColor = (status: Transaction["status"]) =>
  status === "succeeded"
    ? COLORS.success
    : status === "pending" || status === "processing"
    ? COLORS.warning
    : status === "failed" || status === "cancelled" || status === "refunded"
    ? COLORS.error
    : COLORS.muted;

const getPaymentStatusColor = (status: Transaction["status"]) =>
  status === "succeeded"
    ? COLORS.success
    : status === "pending" || status === "processing"
    ? COLORS.warning
    : COLORS.error;

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
    "all" | "succeeded" | "pending" | "processing" | "failed" | "cancelled" | "refunded"
  >("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // Redux integration
  const dispatch = useDispatch();
  const transactions = useSelector(selectTransactions);
  const paymentStatus = useSelector(selectPaymentStatus);

  // Fetch transactions on component mount
  useEffect(() => {
    dispatch(fetchTransactionsThunk({ page: 1, limit: 20 }) as any);
  }, [dispatch]);

  // Filter transactions to show only sales (seller transactions)
  const salesTransactions = (transactions || []).filter((transaction: Transaction) => 
    transaction.metadata?.type === 'sale' || transaction.amount > 0 // Assuming positive amounts are sales
  );

  const filteredSales = salesTransactions.filter((transaction: Transaction) => 
    selectedFilter === "all" || transaction.status === selectedFilter
  );

  const renderSale = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => setShowDetails(showDetails === item.id ? null : item.id)}
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.saleHeader}>
        <Image 
          source={{ uri: item.metadata?.listing_image || 'https://via.placeholder.com/64' }} 
          style={styles.itemImage} 
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.metadata?.listing_title || item.description || 'Transaction'}
          </Text>
          <Text style={styles.itemPrice}>${item.amount}</Text>
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
                { backgroundColor: getPaymentStatusColor(item.status) },
              ]}
            >
              <Text style={styles.badgeText}>
                {item.payment_method.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buyerInfo}>
        <Image 
          source={{ uri: item.metadata?.buyer_avatar || 'https://via.placeholder.com/32' }} 
          style={styles.buyerAvatar} 
        />
        <View style={styles.buyerDetails}>
          <Text style={styles.buyerName}>
            {item.metadata?.buyer_name || 'Buyer'}
          </Text>
          {renderStars(Number(item.metadata?.buyer_rating || 0))}
        </View>
        <Text style={styles.saleDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {showDetails === item.id && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{item.id}</Text>
          </View>

          {item.payment_intent_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Intent</Text>
              <Text style={styles.detailValue}>{item.payment_intent_id}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            {item.status === "pending" && (
              <>
                <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={COLORS.accent}
                  />
                  <Text style={styles.actionText}>Track</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={COLORS.accent}
                  />
                  <Text style={styles.actionText}>Message</Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === "succeeded" && (
              <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={COLORS.accent}
                />
                <Text style={styles.actionText}>Sell Again</Text>
              </TouchableOpacity>
            )}
            {(item.status === "failed" || item.status === "cancelled") && (
              <TouchableOpacity
                style={[styles.actionButton, styles.disputeButton]}
                activeOpacity={Interactions.buttonOpacity}
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

  // Calculate stats from real data
  const totalRevenue = salesTransactions.reduce((sum: number, transaction: Transaction) => sum + transaction.amount, 0);
  const averageRating = 0; // This would come from review data in a real implementation

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>${totalRevenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{salesTransactions.length}</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{averageRating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(["all", "succeeded", "pending", "processing", "failed", "cancelled", "refunded"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              selectedFilter === f && styles.filterActive,
            ]}
            onPress={() => setSelectedFilter(f)}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredSales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color={COLORS.muted} />
            <Text style={styles.emptyText}>No sales found</Text>
            <Text style={styles.emptySubtext}>Start making sales to see them here</Text>
          </View>
        }
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

  detailValue: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "500",
  },
});
