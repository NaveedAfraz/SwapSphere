import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { Interactions } from "@/src/constants/theme";
import SellerBadge from "@/src/features/listing/components/SellerBadge";
import ProfileHeader from "@/src/features/profile/components/ProfileHeader";
import ProfileStats from "@/src/features/profile/components/ProfileStats";
import { useUserMode } from "@/src/contexts/UserModeContext";
import { fetchMyProfileThunk } from "@/src/features/profile/profileThunks";
import { logoutThunk } from "@/src/features/auth/authThunks";
import { PullToRefresh } from "@/src/components/PullToRefresh";
import {
  selectCurrentProfile,
  selectProfileDisplayName,
  selectProfileAvatar,
  selectProfileMemberSince,
  selectProfileIsVerified,
  selectProfileTotalListings,
  selectProfileTotalReviews,
  selectProfileAverageRating,
  selectProfileActiveListings,
  selectProfileSoldItems,
} from "@/src/features/profile/profileSelectors";

// const sellerMenuItems = [
//   { id: 1, title: "My Listings", icon: "grid-outline", count: 12 },
//   { id: 2, title: "Sales", icon: "cash-outline", count: 8 },
//   { id: 3, title: "Reviews", icon: "star-outline", count: 15 },
//   { id: 4, title: "Settings", icon: "settings-outline", count: null },
//   { id: 5, title: "Help & Support", icon: "help-circle-outline", count: null },
//   {
//     id: 6,
//     title: "Sign Out",
//     icon: "log-out-outline",
//     count: null,
//     isDestructive: true,
//   },
// ];

// const customerMenuItems = [
//   { id: 1, title: "My Purchases", icon: "bag-outline", count: 5 },
//   { id: 2, title: "My Reviews", icon: "star-outline", count: 3 },
//   { id: 3, title: "Settings", icon: "settings-outline", count: null },
//   { id: 4, title: "Help & Support", icon: "help-circle-outline", count: null },
//   {
//     id: 5,
//     title: "Sign Out",
//     icon: "log-out-outline",
//     count: null,
//     isDestructive: true,
//   },
// ];

export default function ProfileScreen() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { isSellerMode, setIsSellerMode } = useUserMode();
  const router = useRouter();
  const dispatch = useDispatch();

  // Redux state selectors
  const currentProfile = useSelector(selectCurrentProfile);
  const displayName = useSelector(selectProfileDisplayName);
  const avatar = useSelector(selectProfileAvatar);
  const memberSince = useSelector(selectProfileMemberSince);
  const isVerified = useSelector(selectProfileIsVerified);
  const totalListings = useSelector(selectProfileTotalListings);
  const totalReviews = useSelector(selectProfileTotalReviews);
  const averageRating = useSelector(selectProfileAverageRating);
  const activeListings = useSelector(selectProfileActiveListings);
  const soldItems = useSelector(selectProfileSoldItems);

  // Fetch profile data on mount
  useEffect(() => {
    dispatch(fetchMyProfileThunk() as any);
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchMyProfileThunk() as any);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Dynamic menu items with counts from Redux state
  const getSellerMenuItems = () => [
    {
      id: 1,
      title: "My Listings",
      icon: "grid-outline",
      count: activeListings,
    },
    { id: 2, title: "Sales", icon: "cash-outline", count: soldItems },
    { id: 3, title: "Reviews", icon: "star-outline", count: totalReviews },
    { id: 4, title: "Settings", icon: "settings-outline", count: null },
    {
      id: 5,
      title: "Help & Support",
      icon: "help-circle-outline",
      count: null,
    },
    {
      id: 6,
      title: "Sign Out",
      icon: "log-out-outline",
      count: null,
      isDestructive: true,
    },
  ];

  const getCustomerMenuItems = () => [
    { id: 1, title: "My Purchases", icon: "bag-outline", count: 0 }, // TODO: Add purchases count
    { id: 2, title: "My Reviews", icon: "star-outline", count: 0 }, // TODO: Add customer reviews count
    { id: 3, title: "Settings", icon: "settings-outline", count: null },
    {
      id: 4,
      title: "Help & Support",
      icon: "help-circle-outline",
      count: null,
    },
    {
      id: 5,
      title: "Sign Out",
      icon: "log-out-outline",
      count: null,
      isDestructive: true,
    },
  ];

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(logoutThunk() as any);
            // Navigate to sign-in screen after successful logout
            router.replace("/(auth)/sign-in" as any);
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/(tabs)/profile/edit" as any);
  };

  const handleMenuItemPress = (
    item: ReturnType<typeof getSellerMenuItems>[0]
  ) => {
    if (item.isDestructive) {
      handleSignOut();
    } else {
      setSelectedItem(item.id);

      // Navigate to appropriate screen based on item title and mode
      const routeMap: Record<string, any> = {
        "My Listings": "/profile/my-listings",
        Sales: "/profile/sales",
        Reviews: "/profile/my-reviews",
        Settings: "/profile/settings",
        "Help & Support": "/profile/help-support",
        "My Purchases": "/profile/my-purchases",
        "My Reviews": "/profile/my-reviews",
      };

      const route = routeMap[item.title];
      if (route) {
        router.push(route as any);
      } else {
        console.log("Navigate to:", item.title);
      }

      // Reset selection after navigation
      setTimeout(() => setSelectedItem(null), 300);
    }
  };

  return (
    <View style={styles.container}>
      <PullToRefresh refreshing={refreshing} onRefresh={handleRefresh}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Ionicons name="create-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <View style={styles.modeToggleContainer}>
          <Text style={styles.modeToggleLabel}>Mode:</Text>
          <View style={styles.modeToggleGroup}>
            <TouchableOpacity
              style={[
                styles.modeToggle,
                isSellerMode ? styles.modeToggleActive : null,
              ]}
              onPress={() => setIsSellerMode(!isSellerMode)}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons
                name="storefront-outline"
                size={18}
                color={isSellerMode ? "#FFFFFF" : "#6B7280"}
              />
              <Text
                style={[styles.modeText, isSellerMode && styles.modeTextActive]}
              >
                Seller
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeToggle,
                !isSellerMode ? styles.modeToggleActive : null,
              ]}
              onPress={() => setIsSellerMode(!isSellerMode)}
              activeOpacity={Interactions.buttonOpacity}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={!isSellerMode ? "#FFFFFF" : "#6B7280"}
              />
              <Text
                style={[
                  styles.modeText,
                  !isSellerMode && styles.modeTextActive,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ProfileHeader
          name={displayName || "User"}
          avatar={
            avatar ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
          }
          memberSince={memberSince || new Date().getFullYear().toString()}
          verified={isVerified}
          onEdit={handleEditProfile}
        />

        <ProfileStats
          totalListings={totalListings}
          totalReviews={totalReviews}
          rating={averageRating}
        />

        <View style={styles.menuSection}>
          {(isSellerMode ? getSellerMenuItems() : getCustomerMenuItems()).map(
            (item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  selectedItem === item.id && styles.menuItemSelected,
                  item.isDestructive && styles.menuItemDestructive,
                ]}
                onPress={() => handleMenuItemPress(item)}
                activeOpacity={Interactions.activeOpacity}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.isDestructive ? "#DC2626" : "#6B7280"}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      item.isDestructive && styles.menuItemTextDestructive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.count !== null && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{item.count}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SwapSphere v1.0.0</Text>
          <Text style={styles.footerText}>
            Made with ❤️ for peer-to-peer trading
          </Text>
        </View>
      </PullToRefresh>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  editButton: {
    padding: 8,
  },
  modeToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 20,
  },
  modeToggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modeToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#D1D5DB",
    borderRadius: 12,
    padding: 2,
  },
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modeToggleActive: {
    backgroundColor: "#111827",
  },
  modeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 4,
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  menuSection: {
    marginTop: 20,

    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  menuItemDestructive: {
    borderBottomColor: "#FEE2E2",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
  },
  menuItemTextDestructive: {
    color: "#EF4444",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: "#D1D5DB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 120,
  },
  footerText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
});
