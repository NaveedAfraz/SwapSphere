import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { useDispatch, useSelector } from "react-redux";
import { fetchTransactionsThunk } from '../../payment/paymentThunks';
import { selectTransactions, selectPaymentStatus } from '../../payment/paymentSelectors';
import type { Transaction } from '../../payment/types/payment';

const getStatusColor = (status: Transaction["status"]) =>
  status === "succeeded"
    ? "#10B981"  // Green for success
    : status === "pending" || status === "processing"
    ? "#F59E0B"  // Amber for warning
    : status === "failed" || status === "cancelled" || status === "refunded"
    ? "#DC2626"  // Red for error
    : "#6B7280"; // Gray for muted

const getPaymentStatusColor = (status: Transaction["status"]) =>
  status === "succeeded"
    ? "#10B981"  // Green for success
    : status === "pending" || status === "processing"
    ? "#F59E0B"  // Amber for warning
    : "#DC2626";  // Red for error

const renderStars = (rating: number, size = 14, theme: any) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? "star" : "star-outline"}
        size={size}
        color={star <= rating ? "#F59E0B" : theme.colors.border}
      />
    ))}
  </View>
);

export default function Sales() {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "succeeded" | "pending" | "processing" | "failed" | "cancelled" | "refunded"
  >("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const { theme } = useTheme();

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
          <ThemedText type="body" style={styles.itemTitle}>
            {item.metadata?.listing_title || item.description || 'Transaction'}
          </ThemedText>
          <ThemedText type="body" style={styles.itemPrice}>${item.amount}</ThemedText>
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
          <ThemedText type="body" style={styles.buyerName}>
            {item.metadata?.buyer_name || 'Buyer'}
          </ThemedText>
          {renderStars(Number(item.metadata?.buyer_rating || 0), 14, theme)}
        </View>
        <ThemedText type="caption" style={styles.saleDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </ThemedText>
      </View>

      {showDetails === item.id && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <ThemedText type="caption" style={styles.detailLabel}>Transaction ID</ThemedText>
            <ThemedText type="caption" style={styles.detailValue}>{item.id}</ThemedText>
          </View>

          {item.payment_intent_id && (
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={styles.detailLabel}>Payment Intent</ThemedText>
              <ThemedText type="caption" style={styles.detailValue}>{item.payment_intent_id}</ThemedText>
            </View>
          )}

          <View style={styles.actionButtons}>
            {item.status === "pending" && (
              <>
                <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <ThemedText type="caption" style={styles.actionText}>Track</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={theme.colors.accent}
                  />
                  <ThemedText type="caption" style={styles.actionText}>Message</ThemedText>
                </TouchableOpacity>
              </>
            )}
            {item.status === "succeeded" && (
              <TouchableOpacity style={styles.actionButton} activeOpacity={Interactions.buttonOpacity}>
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={theme.colors.accent}
                />
                <ThemedText type="caption" style={styles.actionText}>Sell Again</ThemedText>
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
                  color="#FFFFFF"
                />
                <ThemedText type="caption" style={[styles.actionText, { color: "#FFFFFF" }]}>
                  Resolve
                </ThemedText>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.stat}>
          <ThemedText type="heading" style={styles.statValue}>${totalRevenue.toFixed(0)}</ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>Revenue</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText type="heading" style={styles.statValue}>{salesTransactions.length}</ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>Sales</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText type="heading" style={styles.statValue}>{averageRating}</ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>Rating</ThemedText>
        </View>
      </View>

      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
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
            <ThemedText
              type="caption"
              style={[
                styles.filterText,
                selectedFilter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </ThemedText>
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
            <Ionicons name="cash-outline" size={48} color={theme.colors.secondary} />
            <ThemedText type="body" style={styles.emptyText}>No sales found</ThemedText>
            <ThemedText type="caption" style={styles.emptySubtext}>Start making sales to see them here</ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  statsContainer: {
    flexDirection: "row",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },

  stat: { flex: 1, alignItems: "center" },

  statValue: { fontSize: 22, fontWeight: "700", marginBottom: 4 },

  statLabel: { fontSize: 12, marginTop: 4 },

  filterContainer: {
    flexDirection: "row",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },

  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },

  filterActive: {},

  filterText: { fontSize: 12, fontWeight: "600" },

  filterTextActive: {},

  saleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  saleHeader: { flexDirection: "row", marginBottom: 12 },

  itemImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },

  itemInfo: { flex: 1 },

  itemTitle: { fontSize: 16, fontWeight: "600" },

  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },

  statusRow: { flexDirection: "row", gap: 8, marginTop: 8 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  badgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },

  buyerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },

  buyerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },

  buyerDetails: { flex: 1 },

  buyerName: { fontSize: 14, fontWeight: "600" },

  saleDate: { fontSize: 12 },

  starContainer: { flexDirection: "row" },

  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  detailLabel: { fontSize: 14, fontWeight: "600" },

  actionButtons: { flexDirection: "row", gap: 12 },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "transparent",
    flex: 1,
  },

  actionText: { fontSize: 12, fontWeight: "600" },

  disputeButton: {},

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
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
});
