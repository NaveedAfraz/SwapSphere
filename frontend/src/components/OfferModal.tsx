import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/contexts/ThemeContext";

interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (price: string, message: string) => void;
  listing: {
    id: string;
    title: string;
    price: string;
    image: string;
    seller: string;
  };
  sellerOffer?: string;
  buyerOffer?: string;
  isSeller?: boolean; // Add user role prop
  isSubmitting?: boolean;
  initialPrice?: string;
  initialMessage?: string;
}

const OfferModal: React.FC<OfferModalProps> = ({
  visible,
  onClose,
  onSubmit,
  listing,
  sellerOffer,
  buyerOffer,
  isSeller = false,
  isSubmitting = false,
  initialPrice = "",
  initialMessage = "",
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [offerPrice, setOfferPrice] = React.useState(initialPrice);
  const [offerMessage, setOfferMessage] = React.useState(initialMessage);

  // Determine if this is a seller responding to an intent
  const isSellerRespondingToIntent = isSeller && buyerOffer && !sellerOffer;

  // Debug log to check props
  React.useEffect(() => {
    if (visible) {
      console.log('OfferModal props:', {
        listing,
        sellerOffer,
        buyerOffer,
        initialPrice,
        isSeller,
        isSellerRespondingToIntent
      });
    }
  }, [visible, listing, sellerOffer, buyerOffer, initialPrice, isSeller, isSellerRespondingToIntent]);

  React.useEffect(() => {
    if (visible) {
      setOfferPrice(initialPrice);
      setOfferMessage(initialMessage);
    }
  }, [visible, initialPrice, initialMessage]);

  const handleSubmit = () => {
    if (offerPrice.trim()) {
      onSubmit(offerPrice.trim(), offerMessage.trim());
    }
  };

  const handleClose = () => {
    setOfferPrice("");
    setOfferMessage("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.theme.colors.background }]}>
        {/* Modal Header */}
        <View style={[styles.header, { backgroundColor: theme.theme.colors.surface, borderBottomColor: theme.theme.colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.theme.colors.primary }]}>
            {isSellerRespondingToIntent ? "Respond to Intent" : "Make an Offer"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Listing Info */}
        <View style={[styles.preview, { backgroundColor: theme.theme.colors.surface, borderColor: theme.theme.colors.border }]}>
          <Image
            source={{ uri: listing.image }}
            style={styles.previewImage}
          />
          <View style={styles.previewInfo}>
            <Text style={[styles.previewTitle, { color: theme.theme.colors.primary }]} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={[styles.previewPrice, { color: theme.theme.colors.accent }]}>{listing.price}</Text>
            {buyerOffer && (
              <Text style={[styles.buyerOfferPrice, { color: theme.theme.colors.warning }]}>
                {isSeller ? "Buyer's Budget: " : "Your Budget: "}{buyerOffer}
              </Text>
            )}
            {sellerOffer && !buyerOffer && (
              <Text style={[styles.sellerOfferPrice, { color: theme.theme.colors.success }]}>
                Seller's Offer: {sellerOffer}
              </Text>
            )}
            {/* Debug info */}
            {__DEV__ && (
              <Text style={{ fontSize: 10, color: 'gray' }}>
                Debug: buyerOffer={buyerOffer ? 'YES' : 'NO'}, sellerOffer={sellerOffer ? 'YES' : 'NO'}
              </Text>
            )}
            <Text style={[styles.previewSeller, { color: theme.theme.colors.secondary }]}>
              Seller: {listing.seller}
            </Text>
          </View>
        </View>

        {/* Offer Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.theme.colors.primary }]}>
              {isSellerRespondingToIntent ? "Your Counter Offer" : "Your Offer Price"}
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.theme.colors.surface, 
                borderColor: theme.theme.colors.border,
                color: theme.theme.colors.primary
              }]}
              placeholder="Enter your offer"
              placeholderTextColor={theme.theme.colors.secondary}
              value={offerPrice}
              onChangeText={setOfferPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.theme.colors.primary }]}>
              {isSeller ? "Message to Buyer" : "Message to Seller"}
            </Text>
            <TextInput
              style={[styles.messageInput, { 
                backgroundColor: theme.theme.colors.surface, 
                borderColor: theme.theme.colors.border,
                color: theme.theme.colors.primary
              }]}
              placeholder={isSeller ? "Add a message to the buyer..." : "Add a message to the seller..."}
              placeholderTextColor={theme.theme.colors.secondary}
              value={offerMessage}
              onChangeText={setOfferMessage}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton, 
            { backgroundColor: isSubmitting ? theme.theme.colors.secondary : theme.theme.colors.accent }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isSellerRespondingToIntent ? "Send Counter Offer" : "Send Offer"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  preview: {
    flexDirection: "row",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sellerOfferPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  buyerOfferPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  previewSeller: {
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OfferModal;
