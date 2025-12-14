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
  Heart,
  Bell,
  Shield,
  ChevronRight,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  muted: "#6B7280",
  surface: "#D1D5DB",
  bg: "#F9FAFB",
  white: "#FFFFFF",
  success: "#10B981",
  error: "#DC2626",
  warning: "#F59E0B",
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
  badgeColor?: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export default function SidebarDrawer({
  isVisible,
  onClose,
}: SidebarDrawerProps) {
  const router = useRouter();
  const translateX = React.useRef(new Animated.Value(-width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const menuSections: MenuSection[] = [
    {
      items: [
        {
          id: "home",
          title: "Home",
          icon: Home,
          onPress: () => handleNavigation("/(tabs)"),
        },
        {
          id: "search",
          title: "Explore",
          icon: Search,
          onPress: () => handleNavigation("/(tabs)/search"),
        },
        {
          id: "messages",
          title: "Messages",
          icon: MessageSquare,
          onPress: () => handleNavigation("/(tabs)/inbox"),
          badge: "3",
          badgeColor: COLORS.accent,
        },
        {
          id: "add-listing",
          title: "Sell an Item",
          icon: Package,
          onPress: () => handleNavigation("/(tabs)/add"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          id: "profile",
          title: "My Profile",
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
          id: "favorites",
          title: "Favorites",
          icon: Heart,
          onPress: () => handleNavigation("/profile/favorites"),
        },
        {
          id: "notifications",
          title: "Notifications",
          icon: Bell,
          onPress: () => handleNavigation("/profile/notifications"),
          badge: "5",
          badgeColor: COLORS.warning,
        },
      ],
    },
    {
      title: "More",
      items: [
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
        {
          id: "privacy",
          title: "Privacy & Safety",
          icon: Shield,
          onPress: () => handleNavigation("/profile/privacy"),
        },
      ],
    },
  ];

  const handleNavigation = (path: string) => {
    onClose();
    setTimeout(() => {
      try {
        if (path.startsWith("/(tabs)")) {
          router.replace(path as any);
        } else {
          router.push(path as any);
        }
      } catch (error) {
        console.warn("Navigation error:", error);
        router.replace("/(tabs)" as any);
      }
    }, 250);
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      handleNavigation("/(tabs)");
    }, 250);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

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
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={22} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={styles.statusIndicator} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>John Doe</Text>
              <Text style={styles.userEmail}>john.doe@example.com</Text>
            </View>
            <TouchableOpacity
              style={styles.profileArrow}
              onPress={() => handleNavigation("/(tabs)/profile")}
            >
              <ChevronRight size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuContent}
        >
          {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              {section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              <View style={styles.sectionItems}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 &&
                        styles.menuItemLast,
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemContent}>
                      <View style={styles.iconContainer}>
                        <item.icon
                          size={22}
                          color={COLORS.dark}
                          strokeWidth={2}
                        />
                      </View>
                      <Text style={styles.menuText}>{item.title}</Text>
                    </View>
                    <View style={styles.menuRight}>
                      {item.badge && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: item.badgeColor || COLORS.accent,
                            },
                          ]}
                        >
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <ChevronRight
                        size={18}
                        color={COLORS.surface}
                        strokeWidth={2}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out Button */}
          <View style={styles.signOutSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={styles.signOutContent}>
                <LogOut size={20} color={COLORS.error} strokeWidth={2} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <View style={styles.brandIcon}>
                <Package size={16} color={COLORS.accent} strokeWidth={2.5} />
              </View>
              <Text style={styles.brandName}>SwapSphere</Text>
            </View>
            <Text style={styles.footerVersion}>v1.0.0</Text>
          </View>
          <Text style={styles.footerTagline}>
            Premium peer-to-peer marketplace
          </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 99999,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 360,
    backgroundColor: COLORS.white,
    zIndex: 100000,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    backgroundColor: COLORS.bg,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.chipBg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.chipBg,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "500",
  },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.chipBg,
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionItems: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.chipBg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.chipBg,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    letterSpacing: -0.2,
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: -0.1,
  },
  signOutSection: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  signOutButton: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  signOutContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.error,
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.chipBg,
    backgroundColor: COLORS.bg,
    gap: 8,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.chipBg,
  },
  brandName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  footerVersion: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.muted,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  footerTagline: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
