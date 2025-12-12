import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Heart, Star, MapPin, Shield, Clock } from 'lucide-react';

interface ListingCardProps {
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
  liked?: boolean;
  onLike?: () => void;
  onPress?: () => void;
}

export default function ListingCard({
  id,
  title,
  image,
  price,
  location,
  rating,
  reviews,
  seller,
  verified,
  condition,
  posted,
  liked = false,
  onLike,
  onPress,
}: ListingCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        <TouchableOpacity style={styles.likeBtn} onPress={onLike}>
          <Heart 
            size={20} 
            color={liked ? '#3B82F6' : '#fff'} 
            fill={liked ? '#3B82F6' : 'transparent'}
          />
        </TouchableOpacity>
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{condition}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <Text style={styles.price}>{price}</Text>
        </View>
        
        <View style={styles.locationContainer}>
          <MapPin size={14} color="#999" />
          <Text style={styles.location}>{location}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.reviews}>({reviews} reviews)</Text>
          </View>
          <Text style={styles.posted}>{posted}</Text>
        </View>
        
        <View style={styles.sellerContainer}>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{seller}</Text>
            {verified && (
              <View style={styles.verifiedBadge}>
                <Shield size={12} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  likeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  conditionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 24,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B82F6',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  reviews: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 6,
  },
  posted: {
    fontSize: 13,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginRight: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
  },
  contactBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  contactBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
