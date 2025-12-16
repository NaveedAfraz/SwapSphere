import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface CategoriesProps {
  categories: Category[];
}

const COLORS = {
  dark: "#111827",
  muted: "#6B7280",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  surface: "#D1D5DB",
};

export default function Categories({ categories }: CategoriesProps) {
  const router = useRouter();
  const { theme } = useTheme();

  const handleCategoryPress = (category: Category) => {
    router.push(`/listings/${category.name}`);
  };

  return (
    <View style={styles.section}>
      <ThemedText type="subheading" style={styles.sectionTitle}>
        Categories
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            activeOpacity={Interactions.activeOpacity}
            style={[styles.categoryCard, { backgroundColor: cat.color }]}
            onPress={() => handleCategoryPress(cat)}
          >
            {cat.icon ? (
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
            ) : null}
            <ThemedText type="caption" style={styles.categoryName}>
              {cat.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.4,
  },

  categoriesScroll: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },

  categoryCard: {
    width: 104,
    height: 104,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.white,
  },

  categoryIcon: {
    fontSize: 34,
    marginBottom: 6,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
