import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Home,
  Search,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Package,
  MessageSquare,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  success: "#22C55E",
  error: "#DC2626",
  gold: "#FACC15",
  chipBg: "#F3F4F6",
};

interface SidebarDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: any;
  onPress: () => void;
  badge?: string;
}

export default function SidebarDrawer({ isVisible, onClose }: SidebarDrawerProps) {
  const router = useRouter();
  const translateX = React.useRef(new Animated.Value(-width)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isVisible ? 0 : -width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  const menuItems: MenuItem[] = [
    {
      id: "home",
      title: "Home",
      icon: Home,
      onPress: () => handleNavigation("/(tabs)"),
    },
    {
      id: "search",
      title: "Search",
      icon: Search,
      onPress: () => handleNavigation("/(tabs)/search"),
    },
    {
      id: "messages",
      title: "Messages",
      icon: MessageSquare,
      onPress: () => handleNavigation("/(tabs)/inbox"),
      badge: "3",
    },
    {
      id: "add-listing",
      title: "Add Listing",
      icon: Package,
      onPress: () => handleNavigation("/(tabs)/add"),
    },
    {
      id: "profile",
      title: "Profile",
      icon: User,
      onPress: () => handleNavigation("/(tabs)/profile"),
    },
    {
      id: "my-listings",
      title: "My Listings",
      icon: Package,
      onPress: () => handleNavigation("/profile/my-listings"),
    },
    {
      id: "settings",
      title: "Settings",
      icon: Settings,
      onPress: () => handleNavigation("/profile/settings"),
    },
    {
      id: "help",
      title: "Help & Support",
      icon: HelpCircle,
      onPress: () => handleNavigation("/profile/help-support"),
    },
  ];

  const handleNavigation = (path: string) => {
    onClose();
    try {
      // Use replace for tab navigation to avoid creating a stack
      if (path.startsWith("/(tabs)")) {
        router.replace(path as any);
      } else {
        router.push(path as any);
      }
    } catch (error) {
      console.warn("Navigation error:", error);
      // Fallback: try to navigate to home if the path doesn't exist
      router.replace("/(tabs)" as any);
    }
  };

  const handleSignOut = () => {
    onClose();
    // TODO: Implement proper sign out logic
    // For now, just navigate to home
    handleNavigation("/(tabs)");
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      
      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <User size={24} color={COLORS.white} />
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>John Doe</Text>
                <Text style={styles.userEmail}>john.doe@example.com</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <item.icon size={20} color={COLORS.muted} />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.menuItem, styles.signOutItem]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <LogOut size={20} color={COLORS.error} />
              <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SwapSphere v1.0.0</Text>
          <Text style={styles.footerSubtext}>Premium peer-to-peer marketplace</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 99999,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    backgroundColor: COLORS.white,
    zIndex: 100000,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    backgroundColor: COLORS.dark,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.surface,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.dark,
    marginLeft: 12,
  },
  badge: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surface,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  signOutItem: {
    marginTop: 8,
  },
  signOutText: {
    color: COLORS.error,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 11,
    color: COLORS.muted,
  },
});
