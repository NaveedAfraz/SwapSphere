import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Categories from "@/src/features/listings/components/Categories";
import SearchBar from "@/src/features/search/components/SearchBar";
import FeaturedItems from "@/src/features/FeaturedItems";

const categories = [
  { id: 1, name: "Fashion", icon: "", color: "#6B7280" },
  { id: 2, name: "Tech", icon: "", color: "#6B7280" },
  { id: 3, name: "Home", icon: "", color: "#6B7280" },
  { id: 4, name: "Fitness", icon: "", color: "#6B7280" },
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
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const insets = useSafeAreaInsets();

  const toggleLike = (id: number) => {
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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: insets.bottom }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>Search</Text>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
        />

        <Categories categories={categories} />

        <FeaturedItems
          items={searchResults}
          liked={liked}
          toggleLike={toggleLike}
          onMakeOffer={handleMakeOffer}
          onProductPress={handleProductPress}
          sectionTitle="Search Results"
          showSeeAll={false}
          useScrollView={false}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    // marginVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
});
