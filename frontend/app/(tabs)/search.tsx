import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import Categories from "@/src/features/listing/components/Categories";
import FeaturedItems from "@/src/features/FeaturedItems";
import { GlobalThemeWrapper } from "@/src/components/GlobalThemeComponents";

const categories = [
  {
    id: 1,
    name: "Fashion",
    icon: "👗",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Tech",
    icon: "💻",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Home",
    icon: "🏠",
    image:
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Fitness",
    icon: "💪",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "Beauty",
    icon: "💄",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    name: "Travel",
    icon: "✈️",
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop",
  },
];

const searchResults = [
  {
    id: 1,
    title: 'MacBook Pro 16" - Like New',
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
    price: "$1,299",
    location: "San Francisco, CA",
    rating: 4.9,
    category: "Tech",
  },
  {
    id: 2,
    title: "iPhone 13 Pro - 256GB",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    price: "$699",
    location: "New York, NY",
    rating: 4.8,
    category: "Tech",
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [liked, setLiked] = useState<Record<string | number, boolean>>({});
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const toggleLike = (id: string | number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleMakeOffer = (item: any) => {
    console.log("Make offer for:", item.title);
    // TODO: Open offer modal
  };

  const handleProductPress = (item: any) => {
    router.push(`/product/${item.id}`);
  };

  return (
    <GlobalThemeWrapper
      useFullPage={true}
      style={{ paddingBottom: insets.bottom }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: insets.bottom }]}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Search
            </Text>
          </View>

          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.primary,
                },
              ]}
              placeholder="Search items..."
              placeholderTextColor={theme.colors.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Categories categories={categories} />

        <FeaturedItems
          items={searchResults}
          liked={liked}
          toggleLike={toggleLike}
          onMakeOffer={handleMakeOffer}
          onProductPress={handleProductPress}
          useScrollView={false}
        />
      </ScrollView>
    </GlobalThemeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    alignItems: "flex-start",
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1D5DB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
});
