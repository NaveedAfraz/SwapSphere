import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { TrendingUp } from "lucide-react-native";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

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
  const { theme } = useTheme();
  
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.background }]}>
      <View style={styles.sectionHeader}>
        <ThemedText type="heading" style={styles.sectionTitle}>Trending Now</ThemedText>
        <TrendingUp size={20} color={theme.colors.primary} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.trendingScroll}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.trendingCard, { backgroundColor: theme.colors.surface }]}
            activeOpacity={Interactions.activeOpacity}
          >
            <Image source={{ uri: item.image }} style={styles.trendingImage} />
            <View style={[styles.trendBadge, { backgroundColor: theme.colors.primary }]}>
              <TrendingUp size={12} color="#fff" />
              <Text style={[styles.trendText, { color: '#fff' }]}>{item.trend}</Text>
            </View>
            <ThemedText type="body" style={styles.trendingName}>{item.name}</ThemedText>
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
  trendingScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  trendingCard: {
    width: 140,
    marginRight: 15,
    borderRadius: 16,
    overflow: "hidden",
  },
  trendingImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: "600",
    padding: 16,
    paddingTop: 12,
  },
});
