import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Text, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "expo-router";
import Header from "@/src/features/listing/components/Header";
import Categories from "@/src/features/listing/components/Categories";
import FeaturedItems from "@/src/features/FeaturedItems";
import TrendingItems from "@/src/features/listing/components/TrendingItems";
import ReviewsCarousel from "@/src/features/listing/components/ReviewsCarousel";
import SellerBadge from "@/src/features/listing/components/SellerBadge";
import SidebarDrawer from "@/src/features/listing/components/SidebarDrawer";
import { fetchListingsThunk } from "@/src/features/listing/listingThunks";
import { PullToRefresh } from "@/src/components/PullToRefresh";
import { fetchUnreadCountThunk } from "@/src/features/notification/notificationThunks";
import {
  selectListings,
  selectListingStatus,
  selectListingError,
  selectIsListingsLoading,
  selectPagination,
} from "@/src/features/listing/listingSelectors";
import { selectUnreadCount } from "@/src/features/notification/notificationSelectors";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  GlobalThemeWrapper,
  ThemedText,
} from "@/src/components/GlobalThemeComponents";
import type { Listing } from "@/src/features/listing/types/listing";

// Categories data
const categories = [
  {
    id: 1,
    name: "Fashion",
    icon: "👗",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Tech",
    icon: "💻",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Home",
    icon: "🏠",
    image:
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Fitness",
    icon: "💪",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "Beauty",
    icon: "💄",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    name: "Travel",
    icon: "✈️",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop",
  },
];
// Mock data for components that don't have real data yet
const trendingItems = [
  {
    id: 1,
    name: "Wireless Earbuds",
    trend: "+24%",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
  },
  {
    id: 2,
    name: "Smart Watch",
    trend: "+18%",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
  },
  {
    id: 3,
    name: "Camera Lens",
    trend: "+15%",
    image: "https://images.unsplash.com/photo-1606400082777-ef05f3c5cde2?w=400",
  },
];

const reviews = [
  {
    id: 1,
    name: "Sarah Johnson",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
    rating: 5,
    comment:
      "Item was exactly as described and shipment was fast. Seller was very responsive throughout the process.",
    date: "2 days ago",
    listing: "iPhone 13 Pro",
  },
  {
    id: 2,
    name: "Mike Chen",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    rating: 4,
    comment:
      "Great product and communication. Item arrived safely and was well-packaged.",
    date: "3 days ago",
    listing: "Gaming Laptop",
  },
  {
    id: 3,
    name: "Emily Davis",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    rating: 5,
    comment:
      "Perfect transaction! Seller was honest about the condition and answered all my questions quickly.",
    date: "1 week ago",
    listing: "Designer Dress",
  },
];

const sellers = [
  {
    id: 1,
    name: "TechExpert Store",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    rating: 4.9,
    totalReviews: 342,
    totalListings: 89,
    memberSince: "2021",
    verified: true,
    topSeller: true,
    responseRate: "98%",
  },
  {
    id: 2,
    name: "VintageStore",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
    rating: 4.8,
    totalReviews: 256,
    totalListings: 124,
    memberSince: "2020",
    verified: true,
    topSeller: false,
    responseRate: "95%",
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { theme } = useTheme();

  // Redux state
  const listings = useSelector(selectListings);
  const listingStatus = useSelector(selectListingStatus);
  const listingError = useSelector(selectListingError);
  const isLoading = useSelector(selectIsListingsLoading);
  const pagination = useSelector(selectPagination);
  const unreadCount = useSelector(selectUnreadCount);

  // Fetch listings and unread count on component mount
  useEffect(() => {
    dispatch(fetchListingsThunk({ page: 1, limit: 20 }) as any);
    dispatch(fetchUnreadCountThunk() as any);
  }, [dispatch]);

  // Pull to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchListingsThunk({ page: 1, limit: 20 }) as any),
      dispatch(fetchUnreadCountThunk() as any),
    ]).finally(() => setRefreshing(false));
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen
    router.push("/notifications");
  };

  // Transform listing data for FeaturedItems component
  const transformListings = (listings: Listing[]) => {
    return listings.map((listing) => ({
      id: listing.id, // Keep UUID as string
      title: listing.title,
      image:
        listing.primary_image_url ||
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
      price: `$${listing.price}`,
      location: listing.location?.city || "Unknown",
      rating: listing.seller_rating || 0,
      seller: listing.seller_name || "Unknown",
      condition: listing.condition || "Unknown",
      posted: getTimeAgo(listing.created_at),
      category: listing.category || "Other",
    }));
  };

  // Helper function to format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minutes ago`;
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)} hours ago`;
    } else if (seconds < 604800) {
      return `${Math.floor(seconds / 86400)} days ago`;
    } else {
      return `${Math.floor(seconds / 604800)} weeks ago`;
    }
  };

  const toggleLike = (id: number | string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleProductPress = (item: any) => {
    // Alert the press with ID
    alert(`Product pressed with ID: ${item.id}`);

    // Navigate directly with UUID
    router.push(`/product/${item.id}`);
  };

  const handleMakeOffer = (item: any) => {
    // Navigate directly with UUID
    router.push(`/product/${item.id}/offer`);
  };

  const featuredItems = transformListings(listings.slice(0, 6));
  const latestListings = transformListings(listings.slice(6, 12));

  return (
    <GlobalThemeWrapper
      useFullPage={true}
      style={{ paddingBottom: insets.bottom }}
    >
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onMenuPress={toggleDrawer}
        unreadCount={unreadCount}
        onNotificationPress={handleNotificationPress}
      />

      <PullToRefresh
        refreshing={refreshing && isLoading}
        onRefresh={handleRefresh}
      >
        <Categories categories={categories} />

        {/* Featured Items Section */}
        <FeaturedItems
          items={featuredItems}
          liked={liked}
          toggleLike={toggleLike}
          onProductPress={handleProductPress}
          onMakeOffer={handleMakeOffer}
          sectionTitle="Featured Items"
        />

        <TrendingItems items={trendingItems} />

        {/* Latest Listings Section */}
        <FeaturedItems
          items={latestListings}
          liked={liked}
          toggleLike={toggleLike}
          onProductPress={handleProductPress}
          onMakeOffer={handleMakeOffer}
          sectionTitle="Latest Listings"
        />

        {/* Top Sellers Section */}
        <View style={styles.section}>
          <ThemedText type="heading" style={styles.sectionTitle}>
            Top Sellers
          </ThemedText>
          {sellers.map((seller) => (
            <SellerBadge
              key={seller.id}
              {...seller}
              // onPress={() => {
              //   router.push(`/seller/${seller.id}`);
              // }}
            />
          ))}
        </View>

        <ReviewsCarousel reviews={reviews} />

        {/* Loading and Error States */}
        {isLoading && listings.length === 0 && (
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <ThemedText type="body" style={styles.loadingText}>
              Loading listings...
            </ThemedText>
          </View>
        )}

        {listingError && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: theme.colors.error + "20" },
            ]}
          >
            <ThemedText
              type="body"
              style={[styles.errorText, { color: theme.colors.error }]}
            >
              Error: {listingError}
            </ThemedText>
          </View>
        )}
      </PullToRefresh>

      <SidebarDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
      />
    </GlobalThemeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 16,
  },
});
