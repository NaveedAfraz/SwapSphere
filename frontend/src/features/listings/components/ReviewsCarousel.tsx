import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { Star, Quote } from 'lucide-react';

const { width } = Dimensions.get('window');

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  listing: string;
}

interface ReviewsCarouselProps {
  reviews: Review[];
}

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Reviews</Text>
        <Text style={styles.subtitle}>What our users are saying</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {reviews.map(review => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.userContainer}>
                <Image source={{ uri: review.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{review.name}</Text>
                  <Text style={styles.listingName}>{review.listing}</Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={12}
                    color={index < review.rating ? '#FFD700' : '#D1D5DB'}
                    fill={index < review.rating ? '#FFD700' : 'transparent'}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.commentContainer}>
              <Quote size={16} color="#3B82F6" style={styles.quoteIcon} />
              <Text style={styles.comment} numberOfLines={4}>{review.comment}</Text>
            </View>
            
            <Text style={styles.date}>{review.date}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  carousel: {
    marginHorizontal: -20,
  },
  carouselContent: {
    paddingHorizontal: 20,
  },
  reviewCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  listingName: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  quoteIcon: {
    position: 'absolute',
    top: -8,
    left: -4,
    opacity: 0.3,
  },
  comment: {
    fontSize: 13,
    lineHeight: 18,
    color: '#111827',
    paddingLeft: 12,
  },
  date: {
    fontSize: 11,
    color: '#6B7280',
    alignSelf: 'flex-end',
  },
});
