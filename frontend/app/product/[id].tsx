import React, { useState } from "react";
import {
  View,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SingleProduct, { getListingDetails } from "@/src/features/SingleProduct";

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
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const insets = useSafeAreaInsets();

  const listing = getListingDetails(Number(id));

  // Mock similar listings data
  const similarListings = [
    {
      id: 2,
      title: "MacBook Air M2 - 256GB",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
      price: "$999",
      location: "Los Angeles, CA",
      rating: 4.8,
      reviews: 89,
    },
    {
      id: 3,
      title: "Dell XPS 15 - 512GB",
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      price: "$1,199",
      location: "Seattle, WA",
      rating: 4.7,
      reviews: 45,
    },
  ];

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
  };

  const handleProductPress = (item: any) => {
    router.push(`/product/${item.id}` as any);
  };

  const handleSubmitOffer = () => {
    if (!offerPrice || !offerMessage) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Alert.alert(
      "Offer Sent!",
      `Your offer of ${offerPrice} for ${selectedListing?.title} has been sent to ${selectedListing?.seller}`,
      [{ text: "OK", onPress: () => setShowOfferModal(false) }]
    );
  };

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <SingleProduct
        listing={listing}
        onBack={handleBack}
        onMakeOffer={handleMakeOffer}
        onProductPress={handleProductPress}
        similarListings={similarListings}
      />

      {/* Offer Modal */}
      <Modal
        visible={showOfferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOfferModal(false)}
      >
        <View style={(styles.modalContainer, { paddingTop: insets.top })}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.muted,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
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
});
