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
import { useTheme } from '@/src/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { PullToRefresh } from "@/src/components/PullToRefresh";
import { useAuth } from '@/src/hooks/useAuth';
import { fetchTransactionsThunk } from "../../payment/paymentThunks";
import {
  selectTransactions,
  selectPaymentStatus,
} from "../../payment/paymentSelectors";
import { 
  fetchMyOrdersThunk, 
  fetchOrderByIdThunk
} from "../../order/orderThunks";
import { updateOrderStatus } from "../sales/salesThunks";
import { 
  selectMyOrders, 
  selectCurrentOrder,
  selectOrderStatus,
  selectMyOrderById
} from "../../order/orderSelectors";
import { useAppDispatch } from "@/src/hooks/redux";

export default function MyPurchases() {
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "processing" | "completed" | "cancelled"
  >("all");
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Auth check
  const { user } = useAuth();
  console.log('[MyPurchases] User auth state:', user ? 'authenticated' : 'not authenticated', user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return theme.colors.success;
      case "shipping":
        return theme.colors.accent;
      case "processing":
        return theme.colors.warning;
      case "cancelled":
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return theme.colors.success;
      case "pending":
        return theme.colors.warning;
      case "refunded":
        return theme.colors.error;
      default:
        return theme.colors.secondary;
    }
  };

  const renderStars = (rating: number, size = 14) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? "star" : "star-outline"}
        size={size}
        color={star <= rating ? theme.colors.warning : theme.colors.border}
      />
    ))}
  </View>
);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const transactions = useSelector(selectTransactions);
  const paymentStatus = useSelector(selectPaymentStatus);
  const myOrders = useSelector(selectMyOrders);
  const currentOrder = useSelector(selectCurrentOrder);
  const orderStatus = useSelector(selectOrderStatus);
  const orderError = useSelector((state: any) => state.order?.error);
  const paymentError = useSelector((state: any) => state.payment?.error);

  // Handle refresh
  const handleRefresh = async () => {
    console.log('[MyPurchases] Refreshing data...');
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchTransactionsThunk({ page: 1, limit: 20 }) as any),
        dispatch(fetchMyOrdersThunk({ page: 1, limit: 20 }) as any) // Remove invalid status parameter
      ]);
      console.log('[MyPurchases] Refresh completed');
    } catch (error) {
      console.error('[MyPurchases] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfirmDelivery = (order: { id: string; [key: string]: any }) => {
    Alert.alert(
      "Confirm Delivery",
      "Have you received this item? This will mark the order as completed.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm Received",
          onPress: async () => {
            try {
              // Update order status to 'completed'
              await dispatch(updateOrderStatus({ 
                orderId: order.id, 
                status: 'completed' 
              })).unwrap();
              
              Alert.alert("Success", "Delivery confirmed! Order marked as completed.");
              // Refresh orders data
              dispatch(fetchMyOrdersThunk({ page: 1, limit: 20 }));
            } catch (error: any) {
              console.error('Failed to confirm delivery:', error);
              Alert.alert("Error", error || "Failed to confirm delivery");
            }
          }
        }
      ]
    );
  };

  // Fetch both transactions and orders on component mount
  useEffect(() => {
    console.log('[MyPurchases] Component mounted, fetching data...');
    dispatch(fetchTransactionsThunk({ page: 1, limit: 20 }) as any);
    dispatch(fetchMyOrdersThunk({ page: 1, limit: 20 }) as any); // Remove invalid status parameter
  }, [dispatch]);

  // Log data changes
  useEffect(() => {
    console.log('[MyPurchases] Transactions updated:', transactions?.length || 0, 'items');
    console.log('[MyPurchases] MyOrders updated:', myOrders?.length || 0, 'items');
    console.log('[MyPurchases] Order status:', orderStatus);
    console.log('[MyPurchases] Order error:', orderError);
    console.log('[MyPurchases] Payment error:', paymentError);
    
    if (myOrders && myOrders.length > 0) {
      console.log('[MyPurchases] Sample order data:', JSON.stringify(myOrders[0], null, 2));
    }
    
    if (orderError) {
      console.error('[MyPurchases] Full order error:', orderError);
    }
    if (paymentError) {
      console.error('[MyPurchases] Full payment error:', paymentError);
    }
  }, [transactions, myOrders, orderStatus, orderError, paymentError]);

  // Combine transactions and orders for comprehensive view
  const purchaseData = (myOrders || []).map(order => {
    console.log('[MyPurchases] Processing order:', order.id, 'status:', order.status);
    console.log('[MyPurchases] Order listing data:', order.listing);
    console.log('[MyPurchases] Order listing type:', typeof order.listing);
    console.log('[MyPurchases] Order listing keys:', order.listing ? Object.keys(order.listing) : 'null');
    
    return {
      ...order,
      // Find corresponding transaction if available
      transaction: (transactions || []).find((t: any) => t.order_id === order.id),
      // Use order data as primary source, fallback to transaction data
      listing: order.listing || {},
      seller: order.seller || {},
      amount: order.total_amount || 0,
      payment_status: order.payment_status || 'pending',
      status: order.status || 'processing',
    };
  });

  const filteredPurchases = purchaseData.filter(
    (item: any) => {
      const matches = selectedFilter === "all" || item.status === selectedFilter;
      console.log('[MyPurchases] Item filter:', item.id, 'status:', item.status, 'filter:', selectedFilter, 'matches:', matches);
      return matches;
    }
  );

  console.log('[MyPurchases] Final filtered data:', filteredPurchases.length, 'items');

  const renderPurchase = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.purchaseCard}
      onPress={() => router.push(`/profile/${item.id}` as any)}
      activeOpacity={0.9}
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
            ${item.amount || 0}
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
            {item.store_name || "Unknown Seller"}
          </Text>
          {renderStars(item.seller?.rating || 0)}
        </View>
        <Text style={styles.purchaseDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => router.push(`/profile/${item.id}` as any)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={theme.colors.accent}
          />
          <Text style={styles.viewDetailsButtonText}>View Order Details</Text>
        </TouchableOpacity>

        {/* Confirm Delivery Button - Show when order is marked as delivered */}
        {item.status === 'delivered' && (
          <TouchableOpacity
            style={[styles.confirmDeliveryButton]}
            onPress={() => handleConfirmDelivery(item)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color="#FFFFFF"
            />
            <Text style={styles.confirmDeliveryButtonText}>Confirm Delivery</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <FlatList
          data={filteredPurchases}
          renderItem={renderPurchase}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bag-outline" size={48} color={theme.colors.secondary} />
              <Text style={styles.emptyText}>No purchases found</Text>
              <Text style={styles.emptySubtext}>Start browsing and making purchases to see them here</Text>
            </View>
          }
        />
      </PullToRefresh>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },

  purchaseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  purchaseHeader: { flexDirection: "row", marginBottom: 12 },

  itemImage: { width: 64, height: 64, borderRadius: 10, marginRight: 12 },

  itemInfo: { flex: 1 },

  itemTitle: { fontSize: 16, fontWeight: "600", color: theme.colors.primary },

  itemPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.accent,
    marginTop: 4,
  },

  itemCondition: { fontSize: 12, color: theme.colors.secondary, marginTop: 2 },

  statusRow: { flexDirection: "row", gap: 8, marginTop: 8 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  statusText: { fontSize: 10, fontWeight: "700", color: theme.colors.surface },

  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  sellerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },

  sellerDetails: { flex: 1 },

  sellerName: { fontSize: 14, fontWeight: "600", color: theme.colors.primary },

  purchaseDate: { fontSize: 12, color: theme.colors.secondary },

  starContainer: { flexDirection: "row" },

  // View Details Button styles
  actionButtonsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },

  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accent,
    marginLeft: 8,
  },

  confirmDeliveryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#10B981",
    marginTop: 8,
  },

  confirmDeliveryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  detailLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.primary },

  trackingNumber: { fontSize: 13, color: theme.colors.accent },

  actionButtons: { flexDirection: "row", marginTop: 8 },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
  },

  actionButtonText: { fontSize: 12, fontWeight: "600", color: theme.colors.accent },

  secondaryActionButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.warning,
    borderWidth: 1,
  },

  // Enhanced details styles
  detailSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: 8,
  },

  detailValue: { 
    fontSize: 13, 
    color: theme.colors.primary,
    flex: 1,
    textAlign: 'right'
  },

  // Timeline styles
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },

  timelineContent: {
    flex: 1,
  },

  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  timelineDate: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
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
    color: theme.colors.secondary,
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 20,
  },
});
