import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { fetchListingByIdThunk } from "@/src/features/listing/listingThunks";
import { selectCurrentListing, selectListingStatus, selectListingError } from "@/src/features/listing/listingSelectors";
import { createOfferThunk } from "@/src/features/offer/offerThunks";
import { selectCreateStatus, selectCreateError } from "@/src/features/offer/offerSelectors";
import { resetCreateStatus } from "@/src/features/offer/offerSlice";
import SingleProduct from "@/src/features/SingleProduct";

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

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [similarListings, setSimilarListings] = useState<any[]>([]);
  const insets = useSafeAreaInsets();

  // Get listing state from Redux store
  const currentListing = useSelector(selectCurrentListing);
  const listingStatus = useSelector(selectListingStatus);
  const error = useSelector(selectListingError);
  const isLoading = listingStatus === 'loading';
  
  // Get offer state from Redux store
  const offerCreateStatus = useSelector(selectCreateStatus);
  const offerCreateError = useSelector(selectCreateError);
  const isCreatingOffer = offerCreateStatus === 'loading';
  console.log(`ID: ${id}, CurrentListing: ${JSON.stringify(currentListing)}, Loading: ${isLoading}, Error: ${error}`);
  // Fetch product details and similar products
  useEffect(() => {
    if (id) {
      dispatch(fetchListingByIdThunk(id as string) as any);
    }
  }, [id, dispatch]);

  // Handle offer creation errors from Redux state
  useEffect(() => {
    if (offerCreateError) {
      Alert.alert("Error", offerCreateError);
      dispatch(resetCreateStatus());
    }
  }, [offerCreateError, dispatch]);

  // Transform API listing data to match SingleProduct component expectations
  const transformListingForSingleProduct = (apiListing: any) => {
    if (!apiListing) return null;
    
    return {
      id: apiListing.id,
      title: apiListing.title,
      // image:  (apiListing.images?.find((img: any) => img.is_primary)?.url),
      images: apiListing.images?.map((img: any) => img.url) || [],
      price: `$${apiListing.price}`,
      location: `${apiListing.location?.city || 'Unknown'}, ${apiListing.location?.state || ''}`,
      rating: parseFloat(apiListing.seller_rating) || 0,
      reviews: parseInt(apiListing.favorites_count) || 0,
      seller: apiListing.seller_name || 'Unknown',
      verified: apiListing.seller_verified || false,
      condition: apiListing.condition,
      posted: getTimeAgo(apiListing.created_at),
      category: apiListing.category,
      description: apiListing.description,
      seller_id: apiListing.seller_id,
      store_name: apiListing.store_name,
      seller_bio: apiListing.seller_bio,
      seller_avatar: apiListing.seller_avatar,
      quantity: apiListing.quantity,
      currency: apiListing.currency,
    };
  };

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

  const handleBack = () => {
    try {
      router.back();
    } catch (error) {
      router.replace("/(tabs)");
    }
  };

  const handleMakeOffer = (listing: any) => {
    setSelectedListing(listing);
    setOfferPrice("");
    setOfferMessage("");
    setShowOfferModal(true);
    dispatch(resetCreateStatus());
  };

  const handleProductPress = (item: any) => {
    router.push(`/product/${item.id}` as any);
  };

  const handleSubmitOffer = async () => {
    if (!offerPrice || !offerMessage) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const result = await dispatch(createOfferThunk({
        listing_id: selectedListing?.id,
        amount: parseFloat(offerPrice.replace('$', '')),
        message: offerMessage,
      }) as any);

      if (result.meta.requestStatus === 'fulfilled') {
        Alert.alert(
          "Offer Sent!",
          `Your offer of ${offerPrice} for ${selectedListing?.title} has been sent to ${selectedListing?.seller_name || 'the seller'}`,
          [{ text: "OK", onPress: () => {
            setShowOfferModal(false);
            dispatch(resetCreateStatus());
          }}]
        );
      } else {
        // Handle backend error messages properly
        const errorMessage = result.payload || 'Failed to send offer';
        Alert.alert("Error", errorMessage);
      }
    } catch (error: any) {
      // Fallback error handling
      const errorMessage = error?.message || 'Failed to send offer. Please try again.';
      Alert.alert("Error", errorMessage);
    }
  };

  const handleContactSeller = () => {
    // Navigate to chat with the seller
    // Use seller ID from the listing to create/open a conversation
    const sellerId = currentListing?.seller_id;
    if (sellerId) {
      router.push(`/inbox/${sellerId}`);
    } else {
      Alert.alert("Error", "Unable to contact seller at this time.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !currentListing) {
    const errorMessage = error && (error.includes('fetch') || error.includes('network'))
      ? 'Network error. Please check your internet connection and try again.'
      : error || 'Product not found';
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <SingleProduct
        listing={transformListingForSingleProduct(currentListing)!}
        onBack={handleBack}
        onMakeOffer={handleMakeOffer}
        onContactSeller={handleContactSeller}
        onProductPress={handleProductPress}
        similarListings={similarListings}
      />

      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowOfferModal(false);
          dispatch(resetCreateStatus());
        }}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowOfferModal(false);
              dispatch(resetCreateStatus());
            }}>
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
            style={[styles.submitButton, isCreatingOffer && styles.submitButtonDisabled]}
            onPress={handleSubmitOffer}
            disabled={isCreatingOffer}
          >
            {isCreatingOffer ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Send Offer</Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.muted,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 24,
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
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
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.dark,
  },
  messageInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.dark,
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: COLORS.accent,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.muted,
  },
});
