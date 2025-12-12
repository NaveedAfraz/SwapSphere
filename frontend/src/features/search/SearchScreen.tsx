import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Categories from '@/src/features/listings/components/Categories';
import ListingCard from '@/src/features/listings/components/ListingCard';

const categories = [
  { id: 1, name: 'Fashion', icon: '', color: '#FFE66D' },
  { id: 2, name: 'Tech', icon: '', color: '#95E1D3' },
  { id: 3, name: 'Home', icon: '', color: '#F6C1C1' },
  { id: 4, name: 'Fitness', icon: '', color: '#F38181' },
];

const searchResults = [
  {
    id: 1,
    title: 'MacBook Pro 16" - Like New',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    price: '$1,299',
    location: 'San Francisco, CA',
    rating: 4.9,
    reviews: 127,
    seller: 'TechExpert',
    verified: true,
    condition: 'Like New',
    posted: '2 hours ago',
  },
  {
    id: 2,
    title: 'iPhone 13 Pro - 256GB',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    price: '$699',
    location: 'New York, NY',
    rating: 4.8,
    reviews: 89,
    seller: 'MobileHub',
    verified: true,
    condition: 'Excellent',
    posted: '5 hours ago',
  },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const toggleLike = (id: number) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Categories 
          categories={categories} 
        />

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Search Results</Text>
          {searchResults.map(listing => (
            <ListingCard
              key={listing.id}
              {...listing}
              liked={liked[listing.id] || false}
              onLike={() => toggleLike(listing.id)}
              onPress={() => console.log('Listing pressed:', listing.id)}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
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
    color: '#1a1a1a',
  },
  resultsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
});
