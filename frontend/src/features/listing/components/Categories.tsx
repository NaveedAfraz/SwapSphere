import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface Category {
  id: number;
  name: string;
  icon: string;
  image?: string;
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
            onPress={() => handleCategoryPress(cat)}
          >
            <ImageBackground
              source={{ uri: cat.image }}
              style={styles.categoryCard}
              imageStyle={styles.categoryImage}
            >
              {/* Gradient Overlay */}
              <View style={styles.overlay} />

              {/* Content */}
              <View style={styles.categoryContent}>
                {cat.icon ? (
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                ) : null}
                <Text style={styles.categoryName}>{cat.name}</Text>
              </View>
            </ImageBackground>
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
    width: 120,
    height: 140,
    marginRight: 16,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  categoryImage: {
    borderRadius: 24,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 24,
  },

  categoryContent: {
    padding: 2,
    alignItems: "center",
    zIndex: 1,
  },

  categoryIcon: {
    fontSize: 25,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.3,
  },
});
