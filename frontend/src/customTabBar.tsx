import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import {
  Home,
  Search,
  MessageSquare,
  User,
  Plus,
  Headphones as HeadphonesIcon,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUserMode } from "@/src/contexts/UserModeContext";
import { useTheme } from "@/src/contexts/ThemeContext";

type BottomTabBarProps = {
  state: any;
  navigation: any;
  descriptors?: any;
  insets?: any;
};

const { width } = Dimensions.get("window");

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSellerMode } = useUserMode();
  const { theme, isDark } = useTheme();

  // compute bottom offset similar to your TabLayout bottom logic
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 4);

  // helper: navigate to a tab by name (keeps nav semantics)
  const navTo = (name: string) => {
    // navigation.navigate handles if already focused
    navigation.navigate(name);
  };

  // find which route is focused
  const currentRouteName = state.routes[state.index]?.name;

  const tabs = [
    { id: "search", icon: Search, label: "Search" },
    { id: "inbox", icon: MessageSquare, label: "Inbox" },
    { id: "index", icon: Home, label: "Home", isCenter: true },
    {
      id: isSellerMode ? "add" : "create-intent",
      icon: Plus,
      label: isSellerMode ? "Add" : "Create Intent",
      isIntent: !isSellerMode,
    },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const renderTab = (tab: any) => {
    const Icon = tab.icon;
    const isActive = currentRouteName === tab.id;

    // Center elevated home button
    if (tab.isCenter) {
      const gradientColors = isDark 
        ? ['#FFFFFF', '#F3F4F6', '#FFFFFF'] as const
        : ['#111827', '#374151', '#111827'] as const;
      
      return (
        <TouchableOpacity
          key={tab.id}
          onPress={() => navTo(tab.id)}
          style={styles.centerButtonContainer}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.centerButton, isActive && styles.centerButtonActive]}
          >
            <Icon size={32} color={isDark ? "#111827" : "#FFFFFF"} strokeWidth={2.5} />
          </LinearGradient>

          {/* Glow effect for active state */}
          {isActive && <View style={[styles.glowEffect, { backgroundColor: isDark ? '#FFFFFF4D' : '#1118274D' }]} />}
        </TouchableOpacity>
      );
    }

    // Regular tabs
    return (
      <TouchableOpacity
        key={tab.id}
        onPress={() =>
          tab.isIntent ? router.push("/create-intent") : navTo(tab.id)
        }
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.tabIconContainer,
            isActive && [styles.tabIconContainerActive, { backgroundColor: theme.colors.surface }],
          ]}
        >
          <Icon
            size={24}
            color={isActive ? theme.colors.primary : theme.colors.secondary}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {/* Tab Bar Container */}
      <View style={[styles.tabBarWrapper, { paddingBottom: bottomInset }]}>
        {/* Shadow layer for center button */}
        <View style={[styles.centerButtonShadow, { backgroundColor: isDark ? '#00000040' : '#F9FAFB40' }]} />
        <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
          {tabs.map(renderTab)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: Platform.OS === "ios" ? 20 : 12,
  },
  centerButtonShadow: {
    position: "absolute",
    left: "50%",
    top: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8f9fa",
    marginLeft: -40,
    opacity: 0.3,
    ...Platform.select({
      ios: {
        shadowColor: "#1a1a1a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#1a1a1a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIconContainer: {
    width: 48,
    height: 28,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabIconContainerActive: {
    backgroundColor: "#f8f9fa",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1a1a1a",
    marginTop: 4,
  },
  centerButtonContainer: {
    position: "relative",
    marginTop: -30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1a1a1a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  centerButtonActive: {
    transform: [{ scale: 1 }],
  },
  glowEffect: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1a1a1a",
    opacity: 0.3,
    ...Platform.select({
      ios: {
        shadowColor: "#1a1a1a",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
      android: {
        elevation: 0,
      },
    }),
  },
});
