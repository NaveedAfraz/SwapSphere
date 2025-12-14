import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Clock, Tag, Zap } from 'lucide-react-native';

interface OfferCardProps {
  id: number;
  title: string;
  image: string;
  discount: string;
  originalPrice: string;
  discountedPrice: string;
  timeLeft: string;
  category: string;
  onPress?: () => void;
}

export default function OfferCard({ 
  id, 
  title, 
  image, 
  discount, 
  originalPrice, 
  discountedPrice, 
  timeLeft, 
  category,
  onPress 
}: OfferCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={styles.discountBadge}>
          <Tag size={12} color="#fff" />
          <Text style={styles.discountText}>{discount}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Clock size={12} color="#fff" />
          <Text style={styles.timeText}>{timeLeft}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.categoryContainer}>
          <Text style={styles.category}>{category}</Text>
          <Zap size={16} color="#FF6B6B" />
        </View>
        
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{originalPrice}</Text>
          <Text style={styles.discountedPrice}>{discountedPrice}</Text>
        </View>
        
        <TouchableOpacity style={styles.claimBtn}>
          <Text style={styles.claimBtnText}>Claim Offer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 22,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  claimBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
