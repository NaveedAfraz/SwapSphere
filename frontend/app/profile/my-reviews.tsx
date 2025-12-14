import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MyReviews from "@/src/features/profile/components/MyReviews";
import { useUserMode } from "@/src/contexts/UserModeContext";

export default function MyReviewsScreen() {
  const { isSellerMode } = useUserMode();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Reviews as {isSellerMode ? 'Seller' : 'Buyer'}
        </Text>
        <MyReviews isSellerMode={isSellerMode} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
});
