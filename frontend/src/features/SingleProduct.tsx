import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import { useUserMode } from "@/src/contexts/UserModeContext";
import type { Listing } from "./listing/types/listing";

// Theme colors from saved context
const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  lightGray: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  subtleBg: "#F3F4F6",
  success: "#10B981",
  error: "#DC2626",
  warning: "#F59E0B",
};

// Extended interface for SingleProduct component with additional fields
interface SingleProductListing extends Listing {
  images: string[]; // Array of image URLs for gallery
  rating: number;
  reviews: number;
  seller: string;
  verified: boolean;
  posted: string;
}

interface SingleProductProps {
  listing: SingleProductListing;
  onBack: () => void;
  onMakeOffer?: (listing: SingleProductListing) => void;
  onContactSeller?: (listing: SingleProductListing) => void;
  onBuyNow?: (listing: SingleProductListing) => void;
  onProductPress?: (item: any) => void;
  similarListings?: any[];
}

export default function SingleProduct({
  listing,
  onBack,
  onMakeOffer,
  onContactSeller,
  onBuyNow,
  onProductPress,
  similarListings = [],
}: SingleProductProps) {
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isSellerMode } = useUserMode();

  const toggleLike = () => {
    setLiked(!liked);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${listing.title} on SwapSphere! Price: ${listing.price}`,
        url: `https://swapSphere.com/product/${listing.id}`,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the product");
    }
  };

  const handleMakeOfferPress = () => {
    if (onMakeOffer) {
      onMakeOffer(listing);
    } else {
      Alert.alert(
        "Make Offer",
        "Offer functionality will be implemented soon!",
        [{ text: "OK" }]
      );
    }
  };

  const handleContactSellerPress = () => {
    if (onContactSeller) {
      onContactSeller(listing);
    } else {
      Alert.alert(
        "Contact Seller",
        "Chat functionality will be implemented soon!",
        [{ text: "OK" }]
      );
    }
  };

  const handleBuyNowPress = () => {
    if (onBuyNow) {
      onBuyNow(listing);
    } else {
      Alert.alert("Purchase", "Purchase functionality coming soon!", [
        { text: "OK" },
      ]);
    }
  };

  const nextImage = () => {
    if (currentImageIndex < listing.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={toggleLike}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#DC2626" : "#111827"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* Product Images */}
        <View style={styles.imageSection}>
          <View style={styles.mainImageContainer}>
            <Image
              source={{ uri: listing.images[currentImageIndex] }}
              style={styles.mainImage}
            />
            {listing.images.length > 1 && (
              <View style={styles.imageNavigation}>
                <TouchableOpacity
                  style={[
                    styles.imageNavButton,
                    currentImageIndex === 0 && styles.imageNavButtonDisabled,
                  ]}
                  onPress={prevImage}
                  disabled={currentImageIndex === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.imageCounterContainer}>
                  <Text style={styles.imageCounter}>
                    {currentImageIndex + 1} / {listing.images.length}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.imageNavButton,
                    currentImageIndex === listing.images.length - 1 &&
                      styles.imageNavButtonDisabled,
                  ]}
                  onPress={nextImage}
                  disabled={currentImageIndex === listing.images.length - 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Thumbnail Images */}
          {listing.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailContainer}
              contentContainerStyle={styles.thumbnailContent}
            >
              {listing.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    currentImageIndex === index && styles.thumbnailActive,
                  ]}
                  onPress={() => setCurrentImageIndex(index)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          {/* Title, Price and Condition */}
          <View style={styles.titleSection}>
            <View style={styles.titlePriceRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.price}>{listing.price}</Text>
              </View>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{listing.condition}</Text>
              </View>
            </View>

            {/* Location and Posted Time */}
            <View style={styles.metaRow}>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.location}>
                  {listing.location?.city && listing.location?.state
                    ? `${listing.location.city}, ${listing.location.state}`
                    : listing.location?.city ||
                      listing.location?.state ||
                      "Unknown Location"}
                </Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.postedTime}>{listing.posted}</Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>
                  {listing.seller.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerHeader}>
                  <Text style={styles.sellerName}>{listing.seller}</Text>
                  {listing.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                    </View>
                  )}
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.rating}>{listing.rating}</Text>
                  <Text style={styles.reviews}>
                    ({listing.reviews} reviews)
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactSellerPress}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Similar Listings */}
          {similarListings.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Similar Items</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarContent}
              >
                {similarListings.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.similarItem}
                    onPress={() => onProductPress?.(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.similarImage}
                    />
                    <View style={styles.similarInfo}>
                      <Text style={styles.similarTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.similarPrice}>{item.price}</Text>
                      <Text style={styles.similarLocation} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Actions - Only show if not in seller mode */}
      {!isSellerMode && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.offerButton}
            onPress={handleMakeOfferPress}
            activeOpacity={0.8}
          >
            <Ionicons name="pricetag-outline" size={20} color="#3B82F6" />
            <Text style={styles.offerButtonText}>Make Offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={handleBuyNowPress}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  imageSection: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  mainImageContainer: {
    position: "relative",
    width: "100%",
    height: 380,
    backgroundColor: "#F9FAFB",
  },
  mainImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageNavigation: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  imageNavButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 18,
    backdropFilter: "blur(10px)",
  },
  imageNavButtonDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  imageCounterContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backdropFilter: "blur(10px)",
  },
  imageCounter: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  thumbnailContainer: {
    paddingVertical: 16,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  thumbnailActive: {
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  titleSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  titlePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  price: {
    fontSize: 32,
    fontWeight: "800",
    color: "#3B82F6",
    letterSpacing: -0.8,
  },
  conditionBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  conditionText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  location: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  divider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  postedTime: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  sellerSection: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sellerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  reviews: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  descriptionSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  similarSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  similarContent: {
    gap: 12,
    paddingRight: 20,
  },
  similarItem: {
    width: 180,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  similarImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
    backgroundColor: "#F3F4F6",
  },
  similarInfo: {
    padding: 12,
    gap: 6,
  },
  similarTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  similarPrice: {
    fontSize: 17,
    fontWeight: "700",
    color: "#3B82F6",
    letterSpacing: -0.3,
  },
  similarLocation: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  offerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
  },
  offerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B82F6",
    letterSpacing: -0.2,
  },
  buyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
