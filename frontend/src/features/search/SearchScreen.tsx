import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Categories from "@/src/features/listing/components/Categories";
import ListingCard from "@/src/features/listing/components/ListingCard";

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
    reviews: 127,
    seller: "TechExpert",
    verified: true,
    condition: "Like New",
    posted: "2 hours ago",
  },
  {
    id: 2,
    title: "iPhone 13 Pro - 256GB",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
    price: "$699",
    location: "New York, NY",
    rating: 4.8,
    reviews: 89,
    seller: "MobileHub",
    verified: true,
    condition: "Excellent",
    posted: "5 hours ago",
  },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const toggleLike = (id: number) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color="#9CA3AF"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Categories categories={categories} />

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Search Results</Text>
          {searchResults.map((listing) => (
            <ListingCard
              key={listing.id}
              {...listing}
              liked={liked[listing.id] || false}
              onLike={() => toggleLike(listing.id)}
              onPress={() => {}}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  searchContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  resultsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 15,
  },
});
