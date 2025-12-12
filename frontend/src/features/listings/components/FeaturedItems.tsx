import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, Star, MapPin } from 'lucide-react';

interface FeaturedItem {
  id: number;
  title: string;
  image: string;
  category: string;
  rating: number;
  price: string;
  location: string;
}

interface FeaturedItemsProps {
  items: FeaturedItem[];
  liked: Record<number, boolean>;
  toggleLike: (id: number) => void;
}

export default function FeaturedItems({ items, liked, toggleLike }: FeaturedItemsProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {items.map(item => (
        <View key={item.id} style={styles.featuredCard}>
          <Image 
            source={{ uri: item.image }} 
            style={styles.featuredImage}
          />
          <TouchableOpacity 
            style={styles.likeBtn}
            onPress={() => toggleLike(item.id)}
          >
            <Heart 
              size={20} 
              color={liked[item.id] ? '#3B82F6' : '#fff'} 
              fill={liked[item.id] ? '#3B82F6' : 'transparent'}
            />
          </TouchableOpacity>
          <View style={styles.featuredContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category}</Text>
            </View>
            <Text style={styles.featuredTitle}>{item.title}</Text>
            <View style={styles.featuredMeta}>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.rating}>{item.rating}</Text>
              </View>
              <View style={styles.locationContainer}>
                <MapPin size={14} color="#999" />
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>
            <View style={styles.featuredFooter}>
              <Text style={styles.price}>{item.price}</Text>
              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Make Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  likeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: 15,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
  },
  bookBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
