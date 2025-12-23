import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";
import { useRouter } from "expo-router";

export default function ProfileIndex() {
  const { theme } = useTheme();
  const router = useRouter();

  const menuItems = [
    {
      id: "sales",
      title: "My Sales",
      icon: "cash-outline",
      onPress: () => router.push("/profile/sales"),
    },
    {
      id: "purchases",
      title: "My Purchases",
      icon: "cart-outline",
      onPress: () => router.push("/profile/my-purchases"),
    },
    {
      id: "listings",
      title: "My Listings",
      icon: "list-outline",
      onPress: () => router.push("/profile/my-listings"),
    },
    {
      id: "reviews",
      title: "My Reviews",
      icon: "star-outline",
      onPress: () => router.push("/profile/my-reviews"),
    },
    {
      id: "settings",
      title: "Settings",
      icon: "settings-outline",
      onPress: () => router.push("/profile/settings"),
    },
    {
      id: "help",
      title: "Help & Support",
      icon: "help-circle-outline",
      onPress: () => router.push("/profile/help-support"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.border }]}>
            <Ionicons name="person" size={40} color={theme.colors.secondary} />
          </View>
          <View style={styles.profileText}>
            <ThemedText type="heading" style={styles.profileName}>
              Your Profile
            </ThemedText>
            <ThemedText type="caption" style={styles.profileSubtitle}>
              Manage your account and activities
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={theme.colors.primary}
                />
                <ThemedText type="body" style={styles.menuTitle}>
                  {item.title}
                </ThemedText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.secondary}
              />
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
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  menuContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
});
