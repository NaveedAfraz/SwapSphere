import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { fetchListingByIdThunk } from "@/src/features/listing/listingThunks";
import { selectCurrentListing, selectListingStatus, selectListingError } from "@/src/features/listing/listingSelectors";
import { createOfferThunk } from "@/src/features/offer/offerThunks";
import { selectCreateStatus, selectCreateError } from "@/src/features/offer/offerSelectors";
import { resetCreateStatus } from "@/src/features/offer/offerSlice";
import { selectUser as selectAuthUser } from "@/src/features/auth/authSelectors";
import SingleProduct from "@/src/features/SingleProduct";
import OfferModal from "@/src/components/OfferModal";

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
  const currentUser = useSelector(selectAuthUser);
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
      location: apiListing.location || { city: 'Unknown', state: '' },
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
      is_published: apiListing.is_published || true,
      visibility: apiListing.visibility || 'public',
      view_count: apiListing.view_count || '0',
      favorites_count: apiListing.favorites_count || '0',
      metadata: apiListing.metadata || {},
      primary_image_url: apiListing.primary_image_url,
      seller_name: apiListing.seller_name,
      seller_rating: apiListing.seller_rating,
      seller_verified: apiListing.seller_verified,
      tags: apiListing.tags || [],
      is_favorite: apiListing.is_favorite || false,
      created_at: apiListing.created_at || new Date().toISOString(),
      updated_at: apiListing.updated_at || new Date().toISOString(),
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
    // Debug logging to check the values
    console.log("=== OFFER DEBUG ===");
    console.log("currentListing?.seller_id:", currentListing?.seller_id);
    console.log("currentUser?.id:", currentUser?.id);
    console.log("Comparison result:", currentListing?.seller_id === currentUser?.id);
    console.log("currentListing:", currentListing);
    console.log("currentUser:", currentUser);
    
    // Check if current user is the seller of this listing
    if (currentListing?.seller_id === currentUser?.id) {
      Alert.alert(
        "Cannot Make Offer",
        "You cannot make an offer on your own listing.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setShowOfferModal(true);
    dispatch(resetCreateStatus());
  };

  const handleProductPress = (item: any) => {
    router.push(`/product/${item.id}` as any);
  };

  const handleSubmitOffer = async (price: string, message: string) => {
    if (!price || !message) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      const result = await dispatch(createOfferThunk({
        listing_id: currentListing?.id,
        amount: parseFloat(price.replace('$', '')),
        message: message,
      }) as any);

      if (result.meta.requestStatus === 'fulfilled') {
        Alert.alert(
          "Offer Sent!",
          `Your offer of ${price} for ${currentListing?.title} has been sent to ${currentListing?.seller_name || 'the seller'}`,
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
      router.push(`/deal-room/${sellerId}` as any);
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
      <OfferModal
        visible={showOfferModal}
        onClose={() => {
          setShowOfferModal(false);
          dispatch(resetCreateStatus());
        }}
        onSubmit={handleSubmitOffer}
        listing={{
          id: currentListing?.id || '',
          title: currentListing?.title || '',
          price: currentListing?.price || '',
          image: currentListing?.primary_image_url || '',
          seller: currentListing?.seller_name || currentListing?.seller || '',
        }}
        sellerOffer={currentListing?.price || ''}
        isSeller={currentListing?.seller_id === currentUser?.id}
        isSubmitting={isCreatingOffer}
      />
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
});
