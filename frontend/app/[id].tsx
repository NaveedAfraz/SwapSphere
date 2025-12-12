import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Share, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SellerBadge from '@/src/features/listings/components/SellerBadge';

const listingData = {
  id: '1',
  title: 'MacBook Pro 16" - Like New',
  image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200',
  images: [
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200',
    'https://images.unsplash.com/photo-1598928421598-9f2a7b577b71?w=1200',
  ],
  price: '$1,299',
  originalPrice: '$1,999',
  location: 'San Francisco, CA',
  rating: 4.9,
  reviews: 127,
  seller: {
    id: 1,
    name: 'TechExpert Store',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    rating: 4.9,
    totalReviews: 342,
    totalListings: 89,
    memberSince: '2021',
    verified: true,
    topSeller: true,
    responseRate: '98%',
  },
  condition: 'Like New',
  posted: '2 hours ago',
  description: 'Excellent condition MacBook Pro 16" with M1 Pro chip. Barely used, comes with original box and charger. Perfect for creative professionals and developers.',
  category: 'Electronics',
  views: 234,
  likes: 18,
};

const similarListings = [
  {
    id: 2,
    title: 'MacBook Air M2 - 256GB',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    price: '$999',
    location: 'Los Angeles, CA',
    rating: 4.8,
    reviews: 89,
  },
  {
    id: 3,
    title: 'Dell XPS 15 - 512GB',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    price: '$1,199',
    location: 'Seattle, WA',
    rating: 4.7,
    reviews: 45,
  },
];

export default function ListingDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this listing: ${listingData.title} - ${listingData.price}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContact = () => {
    setShowContactOptions(true);
  };

  const handleMakeOffer = () => {
    Alert.alert('Make Offer', 'Offer functionality coming soon!');
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => 
      prev === listingData.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? listingData.images.length - 1 : prev - 1
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          <Image source={{ uri: listingData.images[currentImageIndex] }} style={styles.mainImage} />
          
          {listingData.images.length > 1 && (
            <View style={styles.imageControls}>
              <TouchableOpacity style={styles.imageButton} onPress={prevImage}>
                <Ionicons name="chevron-back" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={nextImage}>
                <Ionicons name="chevron-forward" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.imageIndicator}>
            <Text style={styles.imageIndicatorText}>
              {currentImageIndex + 1} / {listingData.images.length}
            </Text>
          </View>
        </View>

        {/* Listing Info */}
        <View style={styles.listingInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{listingData.price}</Text>
            {listingData.originalPrice && (
              <Text style={styles.originalPrice}>{listingData.originalPrice}</Text>
            )}
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <Ionicons 
                name={liked ? "heart" : "heart-outline"} 
                size={24} 
                color={liked ? "#EF4444" : "#6b7280"} 
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.conditionText}>{listingData.condition}</Text>
          
          <Text style={styles.title}>{listingData.title}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{listingData.location}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{listingData.posted}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{listingData.views} views</Text>
          </View>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>{listingData.rating}</Text>
            <Text style={styles.reviewsText}>({listingData.reviews} reviews)</Text>
          </View>
          
          <Text style={styles.category}>{listingData.category}</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <SellerBadge 
            onPress={() => console.log('Seller profile pressed')}
            {...listingData.seller}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listingData.description}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>Contact Seller</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.offerButton} onPress={handleMakeOffer}>
            <Ionicons name="pricetag-outline" size={20} color="#3B82F6" />
            <Text style={styles.offerButtonText}>Make Offer</Text>
          </TouchableOpacity>
        </View>

        {/* Similar Listings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Similar Listings</Text>
          {similarListings.map(listing => (
            <TouchableOpacity key={listing.id} style={styles.similarItem}>
              <Image source={{ uri: listing.image }} style={styles.similarImage} />
              <View style={styles.similarInfo}>
                <Text style={styles.similarTitle}>{listing.title}</Text>
                <Text style={styles.similarPrice}>{listing.price}</Text>
                <Text style={styles.similarLocation}>{listing.location}</Text>
              </View>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  imageGallery: {
    position: 'relative',
    height: 300,
    backgroundColor: '#ffffff',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageControls: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -20 }],
  },
  imageButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  listingInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 'auto',
  },
  likeButton: {
    padding: 4,
  },
  conditionText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  category: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  sellerSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  offerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  offerButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  similarItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  similarImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  similarInfo: {
    flex: 1,
  },
  similarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  similarPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  similarLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
});
