import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react';

interface TrendingItem {
  id: number;
  name: string;
  trend: string;
  image: string;
}

interface TrendingItemsProps {
  items: TrendingItem[];
}

export default function TrendingItems({ items }: TrendingItemsProps) {
  return (
    <View style={[styles.section, { marginBottom: 30 }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <TrendingUp size={20} color="#3B82F6" />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.trendingScroll}
      >
        {items.map(item => (
          <TouchableOpacity key={item.id} style={styles.trendingCard}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.trendingImage}
            />
            <View style={styles.trendBadge}>
              <TrendingUp size={12} color="#fff" />
              <Text style={styles.trendText}>{item.trend}</Text>
            </View>
            <Text style={styles.trendingName}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  trendingScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  trendingCard: {
    width: 150,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  trendingImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  trendBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trendText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    paddingTop: 12,
  },
});
