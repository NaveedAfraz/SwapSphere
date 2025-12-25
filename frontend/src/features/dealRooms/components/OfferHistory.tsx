import React from "react";
import { View, Text, ScrollView } from "react-native";
import { ThemedText } from "@/src/components/ThemedView";
import { useTheme } from "@/src/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { OfferHistoryItem } from "../types/dealRoom";

interface OfferHistoryProps {
  offerHistory: OfferHistoryItem[];
  currentUserId: string;
}

const OfferHistory: React.FC<OfferHistoryProps> = ({
  offerHistory,
  currentUserId,
}) => {
  const { theme } = useTheme();

  const getStyles = (theme: any) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    title: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600" as const,
      marginBottom: 16,
    },
    ownOffer: {
      backgroundColor: theme.colors.subtle,
    },
    otherOffer: {
      backgroundColor: theme.colors.surface,
    },
    offerCard: {
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
    userInfo: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    userName: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: "500" as const,
      marginLeft: 8,
    },
    timeAgo: {
      color: theme.colors.secondary,
      fontSize: 11,
    },
    price: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: "600" as const,
      marginTop: 8,
    },
    offerDetails: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: 4,
    },
    offerTypeText: {
      fontSize: 12,
      marginLeft: 4,
    },
    swapItems: {
      marginTop: 8,
      paddingLeft: 20,
    },
    swapItem: {
      color: theme.colors.secondary,
      fontSize: 11,
      marginBottom: 2,
    },
    moreItems: {
      color: theme.colors.secondary,
      fontSize: 11,
      fontStyle: "italic" as const,
    },
    statusBadge: {
      position: "absolute" as const,
      top: 12,
      right: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusText: {
      color: "white",
      fontSize: 10,
      fontWeight: "500" as const,
      textTransform: "uppercase" as const,
    },
    emptyContainer: {
      padding: 16,
      alignItems: "center" as const,
    },
    emptyText: {
      color: theme.colors.secondary,
      fontSize: 14,
      marginTop: 8,
    },
  });

  const styles = getStyles(theme);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#10B981"; // green
      case "countered":
        return "#F59E0B"; // amber
      case "accepted":
        return "#3B82F6"; // blue
      case "declined":
        return "#DC2626"; // red
      case "expired":
        return "#6B7280"; // gray
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time";
      case "countered":
        return "arrow-back";
      case "accepted":
        return "checkmark-circle";
      case "declined":
        return "close-circle";
      case "expired":
        return "alert-circle";
      default:
        return "help-circle";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderOfferDetails = (offer: OfferHistoryItem) => {
    if (offer.offer_type === "swap") {
      return (
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
        >
          <Ionicons name="swap-horizontal" size={14} color="#3B82F6" />
          <Text style={{ color: "#3B82F6", fontSize: 12, marginLeft: 4 }}>
            Swap Offer ({offer.swap_items?.length || 0} items)
          </Text>
        </View>
      );
    }

    if (offer.offer_type === "hybrid") {
      return (
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
        >
          <Ionicons name="add-circle" size={14} color="#3B82F6" />
          <Text style={{ color: "#3B82F6", fontSize: 12, marginLeft: 4 }}>
            Hybrid: ${offer.cash_amount} + {offer.swap_items?.length || 0} items
          </Text>
        </View>
      );
    }

    return (
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
      >
        <Ionicons name="cash" size={14} color="#10B981" />
        <Text style={{ color: "#10B981", fontSize: 12, marginLeft: 4 }}>
          Cash Offer
        </Text>
      </View>
    );
  };

  const renderSwapItems = (swapItems: any[]) => {
    if (!swapItems || swapItems.length === 0) return null;

    return (
      <View style={{ marginTop: 8, paddingLeft: 20 }}>
        {swapItems.slice(0, 3).map((item, index) => (
          <Text
            key={index}
            style={{ color: theme.colors.secondary, fontSize: 11, marginBottom: 2 }}
          >
            • {item.title} (${item.price})
          </Text>
        ))}
        {swapItems.length > 3 && (
          <Text style={{ color: theme.colors.secondary, fontSize: 11, fontStyle: "italic" }}>
            ... and {swapItems.length - 3} more items
          </Text>
        )}
      </View>
    );
  };

  if (!offerHistory || offerHistory.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <Ionicons name="document-text-outline" size={32} color={theme.colors.border} />
        <Text style={{ color: theme.colors.secondary, fontSize: 14, marginTop: 8 }}>
          No offer history yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <View style={styles.content}>
          <ThemedText style={styles.title}>Offer History</ThemedText>

          {[...offerHistory]
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .map((offer, index) => {
            const isOwnOffer = offer.buyer_id === currentUserId;
            const timeAgo = formatTimeAgo(offer.created_at);

            return (
              <View
                key={`${offer.id}-${index}`}
                style={[
                  styles.offerCard,
                  isOwnOffer ? styles.ownOffer : styles.otherOffer,
                  {
                    borderLeftWidth: 3,
                    borderLeftColor: getStatusColor(offer.status),
                    minHeight: 80,
                    zIndex: 1000 - index,
                  },
                ]}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={getStatusIcon(offer.status)}
                      size={16}
                      color={getStatusColor(offer.status)}
                    />
                    <ThemedText
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      marginLeft: 8,
                    }}
                  >
                    {isOwnOffer ? "Your Offer" : offer.buyer_name || "Buyer"}
                  </ThemedText>
                  </View>

                  <ThemedText color="secondary" style={{ fontSize: 11 }}>
                    {timeAgo}
                  </ThemedText>
                </View>

                {/* Offer Details */}
                <View style={{ marginTop: 8 }}>
                  <ThemedText
                    style={{ fontSize: 16, fontWeight: "600" }}
                  >
                    ${offer.offered_price}
                  </ThemedText>

                  {renderOfferDetails(offer)}

                  {offer.swap_items && renderSwapItems(offer.swap_items)}
                </View>

                {/* Status Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: getStatusColor(offer.status),
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 10,
                      fontWeight: "500",
                      textTransform: "uppercase",
                    }}
                  >
                    {offer.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default OfferHistory;
