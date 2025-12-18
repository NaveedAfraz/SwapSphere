import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Heart, Star, MapPin } from "lucide-react-native";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface FeaturedItem {
  id: string | number;
  title: string;
  image: string;
  category: string;
  rating: number;
  price: string;
  location: string;
}

interface FeaturedItemsProps {
  items: FeaturedItem[];
  liked: Record<string | number, boolean>;
  toggleLike: (id: string | number) => void;
  onMakeOffer?: (item: FeaturedItem) => void;
  onProductPress?: (item: FeaturedItem) => void;
  sectionTitle?: string;
  showSeeAll?: boolean;
  useScrollView?: boolean;
}

export default function FeaturedItems({
  items,
  liked,
  toggleLike,
  onMakeOffer,
  onProductPress,
  sectionTitle = "Featured",
  showSeeAll = true,
  useScrollView = true,
}: FeaturedItemsProps) {
  const { theme } = useTheme();
  
  const content = (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="subheading" style={styles.sectionTitle}>{sectionTitle}</ThemedText>
        {showSeeAll && (
          <TouchableOpacity>
            <ThemedText type="caption" style={[styles.seeAll, { color: theme.colors.accent }]}>View All</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.featuredCard, { backgroundColor: theme.colors.surface }]}
          onPress={() => onProductPress?.(item)}
          activeOpacity={Interactions.activeOpacity}
        >
          <Image 
            source={{ uri: item.image }} 
            style={styles.featuredImage}
          />
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => toggleLike(item.id)}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Heart
              size={20}
              color={liked[item.id] ? theme.colors.accent : "#fff"}
              fill={liked[item.id] ? theme.colors.accent : "transparent"}
            />
          </TouchableOpacity>
          <View style={styles.featuredContent}>
            <View style={[styles.categoryBadge, { backgroundColor: theme.colors.subtle }]}>
              <ThemedText type="caption" style={styles.categoryBadgeText}>{item.category}</ThemedText>
            </View>
            <ThemedText type="body" style={styles.featuredTitle}>{item.title}</ThemedText>
            <View style={styles.featuredMeta}>
              <View style={styles.ratingContainer}>
                <Star size={14} color={theme.colors.accent} fill={theme.colors.accent} />
                <ThemedText type="caption" style={styles.rating}>{item.rating}</ThemedText>
              </View>
              <View style={styles.locationContainer}>
                <MapPin size={14} color={theme.colors.secondary} />
                <ThemedText type="caption" style={styles.location}>{item.location}</ThemedText>
              </View>
            </View>
            <View style={styles.featuredFooter}>
              <ThemedText type="body" style={styles.price}>{item.price}</ThemedText>
              <TouchableOpacity
                style={[styles.bookBtn, { backgroundColor: theme.colors.accent }]}
                onPress={() => onMakeOffer?.(item)}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Text style={[styles.bookBtnText, { color: '#FFFFFF' }]}>Make Offer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (useScrollView) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  featuredCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  featuredImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  likeBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  featuredContent: {
    padding: 15,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  featuredMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
  },
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
  },
  bookBtn: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: '#FFFFFF',
  },
});
