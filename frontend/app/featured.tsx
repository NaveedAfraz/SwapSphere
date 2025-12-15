import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import FeaturedItems from '@/src/features/FeaturedItems';

const FeaturedScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Sample data - replace with actual data from your state or API
  const sampleItems = [
    {
      id: '1',
      title: 'Vintage Camera',
      image: 'https://via.placeholder.com/300x200',
      category: 'Electronics',
      rating: 4.5,
      price: '$250',
      location: 'New York, NY'
    },
    {
      id: '2',
      title: 'Designer Handbag',
      image: 'https://via.placeholder.com/300x200',
      category: 'Fashion',
      rating: 4.8,
      price: '$450',
      location: 'Los Angeles, CA'
    }
  ];

  const liked: Record<string | number, boolean> = {};

  const toggleLike = (id: string | number) => {
    // Implement like functionality
    console.log('Toggle like for item:', id);
  };

  const onMakeOffer = (item: any) => {
    // Implement make offer functionality
    console.log('Make offer for item:', item);
  };

  const onProductPress = (item: any) => {
    // Implement product press functionality
    console.log('Product pressed:', item);
  };

  return (
    <View style={[
      styles.container,
      { 
        paddingTop: insets.top,
        backgroundColor: theme.theme.colors.background 
      }
    ]}>
      <FeaturedItems
        items={sampleItems}
        liked={liked}
        toggleLike={toggleLike}
        onMakeOffer={onMakeOffer}
        onProductPress={onProductPress}
        sectionTitle="Featured Items"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default FeaturedScreen;
