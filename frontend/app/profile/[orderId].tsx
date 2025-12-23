import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchOrderByIdThunk } from "@/src/features/order/orderThunks";
import {
  selectCurrentOrder,
  selectOrderStatus,
  selectOrderError,
} from "@/src/features/order/orderSelectors";
import PaymentTimeline from "@/src/features/payment/components/PaymentTimeline";

export default function OrderDetailsPage() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const currentOrder = useSelector(selectCurrentOrder);
  const orderStatus = useSelector(selectOrderStatus);
  const orderError = useSelector(selectOrderError);
  const [refreshing, setRefreshing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return theme.colors.success;
      case "shipped":
        return theme.colors.accent;
      case "confirmed":
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

  useEffect(() => {
    if (orderId) {
      console.log("[ORDER DETAILS] Fetching order with ID:", orderId);
      console.log("[ORDER DETAILS] Redux state before fetch:", {
        currentOrder: currentOrder,
        orderStatus: orderStatus,
        orderError: orderError,
      });

      dispatch(fetchOrderByIdThunk(orderId as string) as any);
    }
  }, [orderId, dispatch]);

  useEffect(() => {
    console.log("[ORDER DETAILS] Redux state updated:", {
      currentOrder: currentOrder,
      orderStatus: orderStatus,
      orderError: orderError,
      orderId: orderId,
    });

    if (currentOrder) {
      console.log("[ORDER DETAILS] Order data structure:", {
        orderId: currentOrder.id,
        hasListing: !!currentOrder.listing,
        listingKeys: currentOrder.listing
          ? Object.keys(currentOrder.listing)
          : [],
        hasSeller: !!currentOrder.store_name,
        sellerInfo: {
          storeName: currentOrder.store_name,
          sellerEmail: (currentOrder as any).seller_email,
          buyerEmail: (currentOrder as any).buyer_email,
        },
        paymentInfo: {
          totalAmount: currentOrder.total_amount,
          currency: (currentOrder as any).currency || "USD",
          status: currentOrder.status,
        },
        metadata: (currentOrder as any).metadata,
      });
    }

    if (orderError) {
      console.log("[ORDER DETAILS] Error details:", {
        error: orderError,
        orderId: orderId,
        status: orderStatus,
      });
    }
  }, [currentOrder, orderStatus, orderError, orderId]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (orderId) {
      dispatch(fetchOrderByIdThunk(orderId as string) as any);
    }
    setTimeout(() => setRefreshing(false), 1000);
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

  if (orderStatus === "loading" && !currentOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (orderError && !currentOrder) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={theme.colors.error}
        />
        <Text style={styles.errorText}>Failed to load order details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentOrder) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="document-outline"
          size={48}
          color={theme.colors.secondary}
        />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color={theme.colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderId}>
              Order #{currentOrder.id.slice(0, 8).toUpperCase()}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(currentOrder.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {currentOrder.status?.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.paymentStatusRow}>
            <Text style={styles.paymentStatus}>
              Payment: {currentOrder.payment_status?.toUpperCase()}
            </Text>
            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor: getPaymentStatusColor(
                    currentOrder.payment_status
                  ),
                },
              ]}
            >
              <Text style={styles.paymentBadgeText}>
                {currentOrder.payment_status}
              </Text>
            </View>
          </View>
        </View>

        {/* Item Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <View style={styles.itemCard}>
            <Image
              source={{
                uri:
                  currentOrder.listing?.images?.[0]?.url ||
                  "https://via.placeholder.com/80",
              }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>
                {currentOrder.listing?.title || "Unknown Item"}
              </Text>
              <Text style={styles.itemPrice}>
                ${currentOrder.total_amount || currentOrder.final_price}
              </Text>
              <Text style={styles.itemCondition}>{`${String(
                currentOrder.listing?.condition || "N/A"
              )} Condition`}</Text>
              <Text style={styles.itemQuantity}>
                Quantity: {currentOrder.quantity || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Seller Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <Image
              source={{
                uri:
                  currentOrder.seller_avatar ||
                  "https://via.placeholder.com/48",
              }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {currentOrder.store_name || "Unknown Seller"}
              </Text>
              {renderStars(0)} {/* Rating not available in Order type */}
              <Text style={styles.sellerResponseTime}>
                Usually responds within 2 hours
              </Text>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => {
                if ((currentOrder as any).deal_room?.id) {
                  router.push(
                    `/deal-room/${(currentOrder as any).deal_room.id}`
                  );
                } else {
                  Alert.alert(
                    "No Deal Room",
                    "No deal room available for this order."
                  );
                }
              }}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={theme.colors.accent}
              />
              <Text style={styles.contactButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Shipping Information */}
        {currentOrder.shipping_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Information</Text>
            <View style={styles.shippingCard}>
              <Text style={styles.shippingTitle}>Delivery Address</Text>
              <Text style={styles.shippingAddress}>
                {currentOrder.shipping_address.street},{" "}
                {currentOrder.shipping_address.city}
              </Text>
              <Text style={styles.shippingAddress}>
                {currentOrder.shipping_address.state}{" "}
                {currentOrder.shipping_address.zip_code}
              </Text>
            </View>
          </View>
        )}

        {/* Tracking Information */}
        {currentOrder.tracking_info && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tracking Information</Text>
            <View style={styles.trackingCard}>
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>Tracking Number</Text>
                <Text style={styles.trackingNumber}>
                  {currentOrder.tracking_info.tracking_number}
                </Text>
              </View>
              <View style={styles.trackingRow}>
                <Text style={styles.trackingLabel}>Carrier</Text>
                <Text style={styles.trackingValue}>
                  {currentOrder.tracking_info.carrier}
                </Text>
              </View>
              {currentOrder.tracking_info.estimated_delivery && (
                <View style={styles.trackingRow}>
                  <Text style={styles.trackingLabel}>Est. Delivery</Text>
                  <Text style={styles.trackingValue}>
                    {new Date(
                      currentOrder.tracking_info.estimated_delivery
                    ).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: theme.colors.success },
                ]}
              />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Created</Text>
                <Text style={styles.timelineDate}>
                  {new Date(currentOrder.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
            {currentOrder.updated_at &&
              currentOrder.updated_at !== currentOrder.created_at && (
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: theme.colors.accent },
                    ]}
                  />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Last Updated</Text>
                    <Text style={styles.timelineDate}>
                      {new Date(currentOrder.updated_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
          </View>
        </View>

        {/* Payment Timeline */}
        <View style={styles.section}>
          <PaymentTimeline
            currentStatus={
              (currentOrder as any).payment?.status ||
              (currentOrder as any).payment_status ||
              currentOrder.status ||
              "created"
            }
            updatedAt={{
              unnest: currentOrder.created_at, // Use created_at as fallback for unnest
              created: currentOrder.created_at,
              requires_action: (currentOrder as any).requires_action_at,
              succeeded: (currentOrder as any).succeeded_at,
              failed: (currentOrder as any).failed_at,
              refunded: (currentOrder as any).refunded_at,
              canceled: (currentOrder as any).canceled_at,
              escrowed: (currentOrder as any).escrowed_at,
              released: (currentOrder as any).released_at,
            }}
          />
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method</Text>
              <Text style={styles.paymentValue}>
                {(currentOrder as any).payment?.provider?.toUpperCase() ||
                  "N/A"}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
              <Text style={styles.paymentValue}>
                {(currentOrder as any).payment?.status?.toUpperCase() || "N/A"}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Paid</Text>
              <Text style={styles.paymentValue}>
                $
                {(currentOrder as any).payment?.amount ||
                  currentOrder.total_amount ||
                  "0"}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Currency</Text>
              <Text style={styles.paymentValue}>
                {(currentOrder as any).payment?.currency || "USD"}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment ID</Text>
              <Text style={styles.paymentValue}>
                {(currentOrder as any).payment?.id?.slice(0, 8).toUpperCase() ||
                  "N/A"}
              </Text>
            </View>
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Order Total</Text>
              <Text style={styles.totalValue}>
                ${currentOrder.total_amount || "0"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if ((currentOrder as any).deal_room?.id) {
                router.push(`/deal-room/${(currentOrder as any).deal_room.id}`);
              } else {
                Alert.alert(
                  "No Deal Room",
                  "No deal room available for this order."
                );
              }
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={theme.colors.accent}
            />
            <Text style={styles.actionButtonText}>Contact Seller</Text>
          </TouchableOpacity>

          {currentOrder.status === "confirmed" &&
            !currentOrder.tracking_info && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={theme.colors.warning}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: theme.colors.warning },
                  ]}
                >
                  Remind Seller
                </Text>
              </TouchableOpacity>
            )}

          {(currentOrder.status === "delivered" ||
            currentOrder.status === "shipped") && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={theme.colors.secondary}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.secondary },
                ]}
              >
                Get Help
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    // Header styles
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 7,
      backgroundColor: theme.colors.surface,
    },

    backButton: {
      padding: 8,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    refreshButton: {
      padding: 8,
    },

    // Loading and Error states
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
    },

    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.secondary,
    },

    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      paddingHorizontal: 40,
    },

    errorText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.colors.error,
      textAlign: "center",
    },

    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.colors.accent,
      borderRadius: 8,
    },

    retryButtonText: {
      color: theme.colors.surface,
      fontWeight: "600",
    },

    // Content
    content: {
      flex: 1,
      padding: 20,
    },

    // Status Card
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    statusHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },

    orderId: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },

    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.surface,
    },

    paymentStatusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    paymentStatus: {
      fontSize: 14,
      color: theme.colors.secondary,
    },

    paymentBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },

    paymentBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.colors.surface,
    },

    // Section styles
    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 12,
    },

    // Item Card
    itemCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 16,
    },

    itemInfo: {
      flex: 1,
    },

    itemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 4,
    },

    itemPrice: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.colors.accent,
      marginBottom: 4,
    },

    itemCondition: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 2,
    },

    itemQuantity: {
      fontSize: 14,
      color: theme.colors.secondary,
    },

    // Seller Card
    sellerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    sellerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },

    sellerInfo: {
      flex: 1,
    },

    sellerName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 4,
    },

    sellerResponseTime: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginTop: 4,
    },

    starContainer: {
      flexDirection: "row",
    },

    contactButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.accent,
    },

    contactButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.colors.accent,
      marginLeft: 4,
    },

    // Shipping Card
    shippingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    shippingTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 8,
    },

    shippingAddress: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 2,
    },

    // Tracking Card
    trackingCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    trackingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    trackingLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    trackingNumber: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.accent,
    },

    trackingValue: {
      fontSize: 14,
      color: theme.colors.secondary,
    },

    // Timeline
    timeline: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    timelineItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },

    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 16,
    },

    timelineContent: {
      flex: 1,
    },

    timelineTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 2,
    },

    timelineDate: {
      fontSize: 12,
      color: theme.colors.secondary,
    },

    // Payment Card
    paymentCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    paymentLabel: {
      fontSize: 14,
      color: theme.colors.secondary,
    },

    paymentValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    totalRow: {
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 8,
    },

    totalLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    totalValue: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.accent,
    },

    // Action Section
    actionSection: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 40,
    },

    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    secondaryButton: {
      borderColor: theme.colors.secondary,
    },

    actionButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.accent,
      marginLeft: 8,
    },
  });
