import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Text } from "react-native";
import { Interactions } from "@/src/constants/theme";
import Header from "@/src/features/listings/components/Header";
import Categories from "@/src/features/listings/components/Categories";
import FeaturedItems from "@/src/features/FeaturedItems";
import TrendingItems from "@/src/features/listings/components/TrendingItems";
import OfferCard from "@/src/features/listings/components/OfferCard";
import ListingCard from "@/src/features/listings/components/ListingCard";
import ReviewsCarousel from "@/src/features/listings/components/ReviewsCarousel";
import SellerBadge from "@/src/features/listings/components/SellerBadge";
import SidebarDrawer from "@/src/features/listings/components/SidebarDrawer";

// Dummy data (marketplace-focused)
const categories = [
  { id: 1, name: "Fashion", icon: "", color: "#FFE66D" },
  { id: 2, name: "Tech", icon: "", color: "#95E1D3" },
  { id: 3, name: "Home", icon: "", color: "#F6C1C1" },
  { id: 4, name: "Fitness", icon: "", color: "#F38181" },
];

const featuredItems = [
  {
    id: 1,
    title: 'MacBook Pro 16" • Like New',
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200",
    category: "Electronics",
    rating: 4.9,
    price: "$1,299",
    location: "San Francisco, CA",
    seller: "TechExpert",
  },
  {
    id: 2,
    title: "iPhone 13 Pro • 256GB",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200",
    category: "Electronics",
    rating: 4.8,
    price: "$699",
    location: "New York, NY",
    seller: "MobileHub",
  },
  {
    id: 3,
    title: "Vintage Leather Jacket • Excellent",
    image: "https://images.unsplash.com/photo-1551488831-00ddbb6a9538?w=1200",
    category: "Fashion",
    rating: 4.7,
    price: "$189",
    location: "Brooklyn, NY",
    seller: "VintageStore",
  },
];

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

const offers = [
  {
    id: 1,
    title: "Premium Wireless Headphones — Limited Deal",
    image:
      "https://images.unsplash.com/photo-1518440849672-0c2dda6c3f2e?w=1200",
    discount: "50% OFF",
    originalPrice: "$199",
    discountedPrice: "$99",
    timeLeft: "2h 30m",
    category: "Electronics",
  },
  {
    id: 2,
    title: "Designer Handbag — Seasonal Offer",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200",
    discount: "30% OFF",
    originalPrice: "$299",
    discountedPrice: "$209",
    timeLeft: "5h 15m",
    category: "Fashion",
  },
];

const listings = [
  {
    id: 1,
    title: 'MacBook Pro 16" - Like New Condition',
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
    price: "$1,299",
    location: "San Francisco, CA",
    rating: 4.9,
    reviews: 127,
    seller: "TechExpert",
    verified: true,
    condition: "Like New",
    posted: "2 hours ago",
  },
  {
    id: 2,
    title: "Vintage Leather Jacket - Excellent Condition",
    image: "https://images.unsplash.com/photo-1551488831-00ddbb6a9538?w=800",
    price: "$189",
    location: "New York, NY",
    rating: 4.7,
    reviews: 89,
    seller: "VintageStore",
    verified: true,
    condition: "Excellent",
    posted: "5 hours ago",
  },
  {
    id: 3,
    title: "iPhone 13 Pro • 256GB - Good Condition",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    price: "$599",
    location: "Los Angeles, CA",
    rating: 4.8,
    reviews: 62,
    seller: "MobileHub",
    verified: false,
    condition: "Good",
    posted: "1 day ago",
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
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDrawer = () => {
    setIsDrawerVisible(!isDrawerVisible);
  };

  const handleProductPress = (item: any) => {
    // Navigate to product detail screen
    console.log("Navigate to product:", item.id);
  };

  const handleMakeOffer = (item: any) => {
    console.log("Make offer for:", item.id);
  };

  return (
    <View style={styles.container}>
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onMenuPress={toggleDrawer}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Categories categories={categories} />

        {/* Special Offers Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              {...offer}
              onPress={() => console.log("Offer pressed:", offer.id)}
            />
          ))}
        </View> */}

        <FeaturedItems
          items={featuredItems}
          liked={liked}
          toggleLike={toggleLike}
          onProductPress={handleProductPress}
          onMakeOffer={handleMakeOffer}
        />

        <TrendingItems items={trendingItems} />

        {/* Latest Listings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Listings</Text>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              {...listing}
              liked={liked[listing.id]}
              onLike={() => toggleLike(listing.id)}
              onPress={() => console.log("Listing pressed:", listing.id)}
            />
          ))}
        </View>

        {/* Top Sellers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Sellers</Text>
          {sellers.map((seller) => (
            <SellerBadge
              key={seller.id}
              {...seller}
              onPress={() => console.log("Seller pressed:", seller.id)}
            />
          ))}
        </View>

        <ReviewsCarousel reviews={reviews} />
      </ScrollView>
      
      <SidebarDrawer 
        isVisible={isDrawerVisible} 
        onClose={() => setIsDrawerVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    letterSpacing: -0.5,
  },
});
