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

interface Listing {
  id: number;
  title: string;
  image: string;
  price: string;
  location: string;
  rating: number;
  reviews: number;
  seller: string;
  verified: boolean;
  condition: string;
  posted: string;
  category: string;
  description: string;
  images: string[];
}

interface SingleProductProps {
  listing: Listing;
  onBack: () => void;
  onMakeOffer?: (listing: Listing) => void;
  onContactSeller?: (listing: Listing) => void;
  onBuyNow?: (listing: Listing) => void;
  onProductPress?: (item: any) => void;
  similarListings?: any[];
}

// Mock detailed listing data
const getListingDetails = (id: number): Listing | null => {
  const listings: Record<number, Listing> = {
    1: {
      id: 1,
      title: 'MacBook Pro 16" - Like New Condition',
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200",
      images: [
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200",
      ],
      price: "$1,299",
      location: "San Francisco, CA",
      rating: 4.9,
      reviews: 127,
      seller: "TechExpert",
      verified: true,
      condition: "Like New",
      posted: "2 hours ago",
      category: "Tech",
      description: "Excellent condition MacBook Pro 16\" with M1 Pro chip. 16GB RAM, 512GB SSD. Used for light work only, no scratches or dents. Includes original charger and box.",
    },
    2: {
      id: 2,
      title: "Vintage Leather Jacket - Excellent Condition",
      image: "https://images.unsplash.com/photo-1551488831-00ddbb6a9538?w=1200",
      images: [
        "https://images.unsplash.com/photo-1551488831-00ddbb6a9538?w=1200",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200",
      ],
      price: "$189",
      location: "New York, NY",
      rating: 4.7,
      reviews: 89,
      seller: "VintageStore",
      verified: true,
      condition: "Excellent",
      posted: "5 hours ago",
      category: "Fashion",
      description: "Beautiful vintage leather jacket in excellent condition. Size M, genuine leather. Perfect for fall/winter seasons. Minor wear consistent with age.",
    },
    3: {
      id: 3,
      title: "iPhone 13 Pro • 256GB - Good Condition",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200",
      ],
      price: "$599",
      location: "Los Angeles, CA",
      rating: 4.8,
      reviews: 62,
      seller: "MobileHub",
      verified: false,
      condition: "Good",
      posted: "1 day ago",
      category: "Tech",
      description: "iPhone 13 Pro 256GB in good working condition. Battery health 85%. Some minor scratches on back, screen is perfect. Unlocked for all carriers.",
    },
  };

  return listings[id] || null;
};

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
      Alert.alert("Purchase", "Purchase functionality coming soon!", [{ text: "OK" }]);
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
        <TouchableOpacity onPress={onBack} style={styles.headerButton} activeOpacity={Interactions.buttonOpacity}>
          <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton} activeOpacity={Interactions.buttonOpacity}>
          <Ionicons name="share-outline" size={24} color={COLORS.dark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
                  style={styles.imageNavButton} 
                  onPress={prevImage}
                  disabled={currentImageIndex === 0}
                  activeOpacity={Interactions.buttonOpacity}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={20} 
                    color={currentImageIndex === 0 ? COLORS.muted : COLORS.dark} 
                  />
                </TouchableOpacity>
                <Text style={styles.imageCounter}>
                  {currentImageIndex + 1} / {listing.images.length}
                </Text>
                <TouchableOpacity 
                  style={styles.imageNavButton} 
                  onPress={nextImage}
                  disabled={currentImageIndex === listing.images.length - 1}
                  activeOpacity={Interactions.buttonOpacity}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={currentImageIndex === listing.images.length - 1 ? COLORS.muted : COLORS.dark} 
                  />
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
            >
              {listing.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    currentImageIndex === index && styles.thumbnailActive
                  ]}
                  onPress={() => setCurrentImageIndex(index)}
                  activeOpacity={Interactions.activeOpacity}
                >
                  <Image source={{ uri: image }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          {/* Title and Price */}
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{listing.title}</Text>
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{listing.condition}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleLike} style={styles.likeButton} activeOpacity={Interactions.buttonOpacity}>
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={24} 
                color={liked ? COLORS.error : COLORS.dark} 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.price}>{listing.price}</Text>

          {/* Location and Posted Time */}
          <View style={styles.metaRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color={COLORS.muted} />
              <Text style={styles.location}>{listing.location}</Text>
            </View>
            <Text style={styles.postedTime}>{listing.posted}</Text>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerHeader}>
                  <Text style={styles.sellerName}>{listing.seller}</Text>
                  {listing.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.rating}>{listing.rating}</Text>
                  <Text style={styles.reviews}>({listing.reviews} reviews)</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleContactSellerPress}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={styles.contactButtonText}>Contact Seller</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.offerButton}
              onPress={handleMakeOfferPress}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={styles.offerButtonText}>Make Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.buyButton}
              onPress={handleBuyNowPress}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>

          {/* Similar Listings */}
          {similarListings.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionTitle}>Similar Listings</Text>
              {similarListings.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.similarItem}
                  onPress={() => onProductPress?.(item)}
                  activeOpacity={Interactions.activeOpacity}
                >
                  <Image source={{ uri: item.image }} style={styles.similarImage} />
                  <View style={styles.similarInfo}>
                    <Text style={styles.similarTitle}>{item.title}</Text>
                    <Text style={styles.similarPrice}>{item.price}</Text>
                    <Text style={styles.similarLocation}>{item.location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerButton: {
    padding: 8,
  },
  imageSection: {
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  mainImageContainer: {
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  imageNavigation: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  imageNavButton: {
    padding: 8,
  },
  imageCounter: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: COLORS.accent,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    resizeMode: "cover",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleRow: {
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  conditionBadge: {
    backgroundColor: COLORS.subtleBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  conditionText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "500",
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.accent,
    marginTop: 8,
  },
  likeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 6,
  },
  postedTime: {
    fontSize: 14,
    color: COLORS.muted,
  },
  sellerSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 12,
  },
  sellerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "600",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: COLORS.muted,
    marginLeft: 4,
  },
  contactButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  descriptionSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: COLORS.dark,
    lineHeight: 24,
  },
  actionSection: {
    flexDirection: "row",
    paddingBottom: 40,
    gap: 12,
  },
  offerButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  offerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accent,
  },
  buyButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  similarSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  similarItem: {
    flexDirection: "row",
    backgroundColor: COLORS.subtleBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  similarImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  similarInfo: {
    flex: 1,
    justifyContent: "center",
  },
  similarTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 4,
  },
  similarLocation: {
    fontSize: 12,
    color: COLORS.muted,
  },
});

// Export the function to get listing details for use in screens
export { getListingDetails };
