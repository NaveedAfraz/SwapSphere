import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  Image,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { PullToRefresh } from "@/src/components/PullToRefresh";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import {
  fetchSales,
  refreshSales,
  fetchSalesStats,
  updateOrderStatus,
} from "../sales/salesThunks";
import {
  selectSales,
  selectSalesStats,
  selectSalesStatus,
  selectSalesError,
  selectSalesLoading,
  selectSalesPagination,
  selectHasMoreSales,
} from "../sales/salesSelectors";
import type { Sale } from "../sales/types/sales";
import { useAppDispatch } from "@/src/hooks/redux";

const getStatusColor = (status: string) =>
  status === "completed" || status === "succeeded"
    ? "#10B981" // Green for success
    : status === "pending" || status === "processing"
    ? "#F59E0B" // Amber for warning
    : status === "failed" || status === "cancelled" || status === "refunded"
    ? "#DC2626" // Red for error
    : "#6B7280"; // Gray for muted

const getPaymentStatusColor = (status: string) =>
  status === "completed" || status === "succeeded"
    ? "#10B981" // Green for success
    : status === "pending" || status === "processing"
    ? "#F59E0B" // Amber for warning
    : "#DC2626"; // Red for error

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
    | "all"
    | "completed"
    | "pending"
    | "processing"
    | "failed"
    | "cancelled"
    | "refunded"
  >("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedSaleForStatus, setSelectedSaleForStatus] = useState<Sale | null>(null);
  const { theme } = useTheme();
  const router = useRouter();

  // Redux integration
  const dispatch = useAppDispatch();
  const sales = useSelector(selectSales);
  const salesStats = useSelector(selectSalesStats);
  const salesStatus = useSelector(selectSalesStatus);
  const salesError = useSelector(selectSalesError);
  const isLoading = useSelector(selectSalesLoading);
  const hasMore = useSelector(selectHasMoreSales);

  // Fetch sales on component mount
  useEffect(() => {
    dispatch(fetchSales({ page: 1, limit: 20 }));
  }, [dispatch]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(refreshSales()).unwrap();
    } catch (error) {
      console.error("Failed to refresh sales:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle chat navigation
  const handleChatPress = (sale: Sale) => {
    if (sale.deal_room_id) {
      // Navigate to deal room using the deal_room_id
      router.push(`/deal-room/${sale.deal_room_id}`);
    } else {
      Alert.alert(
        "No Deal Room",
        "This sale doesn't have an associated deal room for chat."
      );
    }
  };

  // Handle status update
  const handleStatusUpdate = (sale: Sale) => {
    setSelectedSaleForStatus(sale);
    setStatusModalVisible(true);
  };

  // Handle status selection
  const handleStatusSelect = async (newStatus: string) => {
    if (!selectedSaleForStatus) return;

    Alert.alert(
      "Update Status",
      `Are you sure you want to mark this sale as ${newStatus}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              // Use existing API endpoint to update order status
              await dispatch(updateOrderStatus({ 
                orderId: selectedSaleForStatus.order_id, 
                status: newStatus 
              })).unwrap();
              
              Alert.alert("Success", `Sale marked as ${newStatus}`);
              setStatusModalVisible(false);
              setSelectedSaleForStatus(null);
              // Refresh sales data
              dispatch(refreshSales());
            } catch (error: any) {
              console.error('Failed to update order status:', error);
              Alert.alert("Error", error || "Failed to update sale status");
            }
          }
        }
      ]
    );
  };

  // Filter sales based on selected filter
  const filteredSales = sales.filter(
    (sale: Sale) =>
      selectedFilter === "all" || sale.order_status === selectedFilter
  );

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() =>
        setShowDetails(showDetails === item.order_id ? null : item.order_id)
      }
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.saleHeader}>
        <Image
          source={{
            uri: item.listing_images?.[0] || "https://via.placeholder.com/64",
          }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <ThemedText type="body" style={styles.itemTitle}>
            {item.listing_title || "Sale"}
          </ThemedText>
          <ThemedText type="body" style={styles.itemPrice}>
            ${item.total_amount}
          </ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.badge,
                { backgroundColor: getStatusColor(item.order_status) },
              ]}
            >
              <ThemedText type="caption" style={styles.badgeText}>
                {item.order_status.toUpperCase()}
              </ThemedText>
            </View>
            {item.payment_status && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: getPaymentStatusColor(item.payment_status),
                  },
                ]}
              >
                <ThemedText type="caption" style={styles.badgeText}>
                  {item.payment_status.toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.buyerInfo}>
        <Image
          source={{
            uri: item.buyer_avatar || "https://via.placeholder.com/32",
          }}
          style={styles.buyerAvatar}
        />
        <View style={styles.buyerDetails}>
          <ThemedText type="body" style={styles.buyerName}>
            {item.buyer_username || "Buyer"}
          </ThemedText>
          {renderStars(0, 14, theme)} // TODO: Add rating from sales data
        </View>
        <ThemedText type="caption" style={styles.saleDate}>
          {new Date(item.order_created_at).toLocaleDateString()}
        </ThemedText>
      </View>

      {showDetails === item.order_id && (
        <View style={styles.expandedDetails}>
          <View style={styles.detailRow}>
            <ThemedText type="caption" style={styles.detailLabel}>
              Order ID
            </ThemedText>
            <ThemedText type="caption" style={styles.detailValue}>
              {item.order_id}
            </ThemedText>
          </View>

          {item.provider_payment_id && (
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={styles.detailLabel}>
                Payment ID
              </ThemedText>
              <ThemedText type="caption" style={styles.detailValue}>
                {item.provider_payment_id}
              </ThemedText>
            </View>
          )}

          <View style={styles.actionButtons}>
            {/* Chat button always available */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={Interactions.buttonOpacity}
              onPress={() => handleChatPress(item)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={theme.colors.accent}
              />
              <ThemedText type="caption" style={styles.actionText}>
                Chat
              </ThemedText>
            </TouchableOpacity>

            {/* Status-specific actions */}
            {item.order_status === "pending" && (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={theme.colors.accent}
                />
                <ThemedText type="caption" style={styles.actionText}>
                  Track
                </ThemedText>
              </TouchableOpacity>
            )}

            {(item.order_status === "completed" ||
              item.order_status === "succeeded") && (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={theme.colors.accent}
                />
                <ThemedText type="caption" style={styles.actionText}>
                  Sell Again
                </ThemedText>
              </TouchableOpacity>
            )}

            {(item.order_status === "failed" ||
              item.order_status === "cancelled") && (
              <TouchableOpacity
                style={[styles.actionButton, styles.disputeButton]}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#FFFFFF"
                />
                <ThemedText type="caption" style={styles.actionText}>
                  Dispute
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Status dropdown button - always available for seller */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={Interactions.buttonOpacity}
              onPress={() => handleStatusUpdate(item)}
            >
              <Ionicons
                name="ellipsis-horizontal-outline"
                size={16}
                color={theme.colors.accent}
              />
              <ThemedText type="caption" style={styles.actionText}>
                Status
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Use sales stats from Redux
  const totalRevenue = salesStats?.total_revenue || 0;
  const totalSales = salesStats?.total_sales || 0;
  const averageRating = 0; // TODO: Add rating from sales data

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.stat}>
          <ThemedText type="heading" style={styles.statValue}>
            ${totalRevenue.toFixed(0)}
          </ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>
            Revenue
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText type="heading" style={styles.statValue}>
            {totalSales}
          </ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>
            Sales
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText type="heading" style={styles.statValue}>
            {averageRating}
          </ThemedText>
          <ThemedText type="caption" style={styles.statLabel}>
            Rating
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.filterContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {(
          [
            "all",
            "completed",
            "pending",
            "processing",
            "failed",
            "cancelled",
            "refunded",
          ] as const
        ).map((f) => (
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

      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <FlatList
          data={filteredSales}
          renderItem={renderSale}
          keyExtractor={(item) => item.order_id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="cash-outline"
                size={48}
                color={theme.colors.secondary}
              />
              <ThemedText type="body" style={styles.emptyText}>
                No sales found
              </ThemedText>
              <ThemedText type="caption" style={styles.emptySubtext}>
                Start making sales to see them here
              </ThemedText>
            </View>
          }
        />
      </PullToRefresh>

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="heading" style={styles.modalTitle}>
                Update Sale Status
              </ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setStatusModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <ThemedText type="body" style={styles.modalSubtitle}>
                Select new status for this sale:
              </ThemedText>
              
              <View style={styles.statusOptions}>
                <TouchableOpacity
                  style={[styles.statusOption, { backgroundColor: '#F0FDF4', borderColor: '#10B981' }]}
                  onPress={() => handleStatusSelect('delivered')}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <ThemedText type="body" style={[styles.statusOptionText, { color: '#065F46' }]}>
                    Mark as Delivered
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.statusOption, { backgroundColor: '#FEF2F2', borderColor: '#DC2626' }]}
                  onPress={() => handleStatusSelect('cancelled')}
                >
                  <Ionicons name="close-circle" size={20} color="#DC2626" />
                  <ThemedText type="body" style={[styles.statusOptionText, { color: '#991B1B' }]}>
                    Mark as Cancelled
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 5,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: "#D1D5DB",
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  closeButton: {
    padding: 4,
  },

  modalBody: {
    paddingBottom: 10,
  },

  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },

  statusOptions: {
    gap: 12,
  },

  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },

  statusOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },

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
