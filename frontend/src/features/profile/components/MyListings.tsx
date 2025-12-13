import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Interactions } from '@/src/constants/theme';

interface Listing {
  id: string;
  title: string;
  price: number;
  image: string;
  status: 'active' | 'sold' | 'pending';
  views: number;
  likes: number;
  postedAt: string;
}

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'iPhone 13 Pro - Excellent Condition',
    price: 899,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    status: 'active',
    views: 234,
    likes: 45,
    postedAt: '2 days ago'
  },
  {
    id: '2',
    title: 'MacBook Air M1 - 2020',
    price: 799,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    status: 'sold',
    views: 567,
    likes: 89,
    postedAt: '1 week ago'
  },
  {
    id: '3',
    title: 'AirPods Pro - Like New',
    price: 179,
    image: 'https://images.unsplash.com/photo-1606214174585-fe25d285063f?w=400',
    status: 'pending',
    views: 123,
    likes: 23,
    postedAt: '3 days ago'
  }
];

const getStatusColor = (status: Listing['status']) => {
  switch (status) {
    case 'active': return '#3B82F6';
    case 'sold': return '#6B7280';
    case 'pending': return '#F59E0B';
    default: return '#6B7280';
  }
};

const getStatusText = (status: Listing['status']) => {
  switch (status) {
    case 'active': return 'Active';
    case 'sold': return 'Sold';
    case 'pending': return 'Pending';
    default: return status;
  }
};

export default function MyListings() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'sold' | 'pending'>('all');

  const filteredListings = mockListings.filter(listing => 
    selectedFilter === 'all' || listing.status === selectedFilter
  );

  const renderListing = ({ item }: { item: Listing }) => (
    <TouchableOpacity style={styles.listingCard} activeOpacity={Interactions.activeOpacity}>
      <Image source={{ uri: item.image }} style={styles.listingImage} />
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.listingPrice}>${item.price}</Text>
        <View style={styles.listingStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.views}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#6B7280" />
            <Text style={styles.statText}>{item.likes}</Text>
          </View>
        </View>
        <View style={styles.listingFooter}>
          <Text style={styles.postedTime}>{item.postedAt}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.moreButton}
        onPress={() => Alert.alert('Options', 'Edit, Delete, Mark as Sold')}
        activeOpacity={Interactions.buttonOpacity}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['all', 'active', 'sold', 'pending'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredListings}
        renderItem={renderListing}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No listings found</Text>
            <Text style={styles.emptySubtext}>Start by creating your first listing</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listingContent: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  listingStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
