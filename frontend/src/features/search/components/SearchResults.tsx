import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ListingCard from '@/src/features/listings/components/ListingCard';

interface SearchResult {
  id: number;
  title: string;
  image: string;
  price: string;
  location: string;
  rating: number;
  reviews: number;
  seller: string;
  verified: boolean;
  condition: string;
  posted: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  liked: Record<number, boolean>;
  onLike: (id: number) => void;
  onPress: (id: number) => void;
}

export default function SearchResults({ results, liked, onLike, onPress }: SearchResultsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Results</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {results.map(listing => (
          <ListingCard
            key={listing.id}
            {...listing}
            liked={liked[listing.id] || false}
            onLike={() => onLike(listing.id)}
            onPress={() => onPress(listing.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
});
