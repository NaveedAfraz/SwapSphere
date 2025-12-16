import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MyReviews from "@/src/features/profile/components/MyReviews";
import { useUserMode } from "@/src/contexts/UserModeContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

export default function MyReviewsScreen() {
  const { isSellerMode } = useUserMode();
  const { theme } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <ThemedText
          type="subheading"
          style={[
            styles.sectionTitle,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          Reviews as {isSellerMode ? "Seller" : "Buyer"}
        </ThemedText>
        <MyReviews isSellerMode={isSellerMode} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
});
