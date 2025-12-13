import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FeaturedItems from "@/src/features/FeaturedItems";

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
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

const mockListings: Listing[] = [
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
    category: "Tech",
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
    category: "Fashion",
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
    category: "Tech",
  },
  {
    id: 4,
    title: "Designer Handbag - Pristine Condition",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
    price: "$349",
    location: "Miami, FL",
    rating: 4.6,
    reviews: 45,
    seller: "LuxuryBoutique",
    verified: true,
    condition: "Pristine",
    posted: "3 days ago",
    category: "Fashion",
  },
  {
    id: 5,
    title: "Smart Home Hub - Brand New",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    price: "$89",
    location: "Seattle, WA",
    rating: 4.5,
    reviews: 28,
    seller: "SmartHome",
    verified: false,
    condition: "Brand New",
    posted: "1 week ago",
    category: "Home",
  },
  {
    id: 6,
    title: "Yoga Mat Premium - Excellent",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800",
    price: "$45",
    location: "Austin, TX",
    rating: 4.8,
    reviews: 156,
    seller: "FitnessGear",
    verified: true,
    condition: "Excellent",
    posted: "4 hours ago",
    category: "Fitness",
  },
];

const priceRanges: FilterOption[] = [
  { id: "1", label: "Under $50", value: "0-50" },
  { id: "2", label: "$50 - $100", value: "50-100" },
  { id: "3", label: "$100 - $500", value: "100-500" },
  { id: "4", label: "$500 - $1000", value: "500-1000" },
  { id: "5", label: "Over $1000", value: "1000+" },
];

const conditions: FilterOption[] = [
  { id: "1", label: "Brand New", value: "new" },
  { id: "2", label: "Like New", value: "like-new" },
  { id: "3", label: "Excellent", value: "excellent" },
  { id: "4", label: "Good", value: "good" },
  { id: "5", label: "Fair", value: "fair" },
];

const sortOptions: FilterOption[] = [
  { id: "1", label: "Newest First", value: "newest" },
  { id: "2", label: "Price: Low to High", value: "price-low" },
  { id: "3", label: "Price: High to Low", value: "price-high" },
  { id: "4", label: "Most Popular", value: "popular" },
];

export default function CategoryListingsScreen() {
  const { category } = useLocalSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");

  // Filter listings based on category and other filters
  const filteredListings = mockListings
    .filter((listing) => listing.category === category)
    .filter(
      (listing) =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMakeOffer = (listing: any) => {
    setSelectedListing(listing);
    setOfferPrice("");
    setOfferMessage("");
    setShowOfferModal(true);
  };

  const handleBack = () => {
    try {
      router.back();
    } catch (error) {
      // If there's no screen to go back to, navigate to home
      router.replace("/(tabs)");
    }
  };

  const handleProductPress = (item: any) => {
    router.push(`/product/${item.id}` as any);
  };

  const handleSubmitOffer = () => {
    if (!offerPrice || !offerMessage) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Here you would normally send the offer to your backend
    Alert.alert(
      "Offer Sent!",
      `Your offer of ${offerPrice} for ${selectedListing?.title} has been sent to ${selectedListing?.seller}`,
      [{ text: "OK", onPress: () => setShowOfferModal(false) }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category} Listings</Text>
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <Ionicons name="options" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Price Range</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {priceRanges.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    style={[
                      styles.filterChip,
                      selectedPriceRange === range.value &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedPriceRange(
                        selectedPriceRange === range.value ? "" : range.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedPriceRange === range.value &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Condition</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {conditions.map((condition) => (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.filterChip,
                      selectedCondition === condition.value &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedCondition(
                        selectedCondition === condition.value
                          ? ""
                          : condition.value
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCondition === condition.value &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {condition.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Sort By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortOptions.map((sort) => (
                  <TouchableOpacity
                    key={sort.id}
                    style={[
                      styles.filterChip,
                      selectedSort === sort.value && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedSort(sort.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedSort === sort.value &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredListings.length} listings found
          </Text>
        </View>

        {/* Listings */}
        <FeaturedItems
          items={filteredListings}
          liked={liked}
          toggleLike={toggleLike}
          onMakeOffer={handleMakeOffer}
          onProductPress={handleProductPress}
          sectionTitle={`${category} Listings`}
          showSeeAll={false}
          useScrollView={false}
        />

        {/* Offer Modal */}
        <Modal
          visible={showOfferModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowOfferModal(false)}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Make an Offer</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Listing Info */}
            <View style={styles.listingPreview}>
              <Image
                source={{ uri: selectedListing?.image }}
                style={styles.previewImage}
              />
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {selectedListing?.title}
                </Text>
                <Text style={styles.previewPrice}>{selectedListing?.price}</Text>
                <Text style={styles.previewSeller}>
                  Seller: {selectedListing?.seller}
                </Text>
              </View>
            </View>

            {/* Offer Form */}
            <View style={styles.offerForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Offer Price</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Enter your offer"
                  placeholderTextColor={COLORS.muted}
                  value={offerPrice}
                  onChangeText={setOfferPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message to Seller</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Add a message to the seller..."
                  placeholderTextColor={COLORS.muted}
                  value={offerMessage}
                  onChangeText={setOfferMessage}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitOffer}
            >
              <Text style={styles.submitButtonText}>Send Offer</Text>
            </TouchableOpacity>
          </View>
        </Modal>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.dark,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.subtleBg,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  resultsCount: {
    fontSize: 16,
    color: COLORS.muted,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  listingPreview: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: "cover",
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 4,
  },
  bookBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 4,
  },
  previewSeller: {
    fontSize: 14,
    color: COLORS.muted,
  },
  offerForm: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 8,
  },
  priceInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.dark,
  },
  messageInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.dark,
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
