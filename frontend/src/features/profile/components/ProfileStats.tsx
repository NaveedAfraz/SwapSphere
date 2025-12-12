import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileStatsProps {
  totalListings: number;
  totalReviews: number;
  rating: number;
}

export default function ProfileStats({ totalListings, totalReviews, rating }: ProfileStatsProps) {
  return (
    <View style={styles.statsSection}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{totalListings}</Text>
        <Text style={styles.statLabel}>Listings</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{totalReviews}</Text>
        <Text style={styles.statLabel}>Reviews</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{rating}</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 0,
    paddingVertical: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
});
