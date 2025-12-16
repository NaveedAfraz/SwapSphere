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
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

const { width } = Dimensions.get("window");

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
  const { theme } = useTheme();
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
          badgeColor: theme.colors.primary,
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
          badgeColor: theme.colors.warning,
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
            backgroundColor: theme.colors.surface,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={onClose}>
              <X size={22} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: theme.colors.success, borderColor: theme.colors.surface }]} />
            </View>
            <View style={styles.userDetails}>
              <ThemedText type="body" style={styles.userName}>John Doe</ThemedText>
              <ThemedText type="caption" style={styles.userEmail}>john.doe@example.com</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.profileArrow, { backgroundColor: theme.colors.border }]}
              onPress={() => handleNavigation("/(tabs)/profile")}
            >
              <ChevronRight size={20} color={theme.colors.secondary} />
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
                <ThemedText type="caption" style={styles.sectionTitle}>{section.title}</ThemedText>
              )}
              <View style={[styles.sectionItems, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 &&
                        styles.menuItemLast,
                      { borderBottomColor: theme.colors.border }
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuItemContent}>
                      <View style={[styles.iconContainer, { backgroundColor: theme.colors.background }]}>
                        <item.icon
                          size={22}
                          color={theme.colors.primary}
                          strokeWidth={2}
                        />
                      </View>
                      <ThemedText type="body" style={styles.menuText}>{item.title}</ThemedText>
                    </View>
                    <View style={styles.menuRight}>
                      {item.badge && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: item.badgeColor || theme.colors.primary,
                            },
                          ]}
                        >
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                      <ChevronRight
                        size={18}
                        color={theme.colors.border}
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
              style={[styles.signOutButton, { backgroundColor: theme.colors.border, borderColor: theme.colors.border }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <View style={styles.signOutContent}>
                <LogOut size={20} color={theme.colors.error} strokeWidth={2} />
                <ThemedText type="body" style={styles.signOutText}>Sign Out</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <View style={[styles.brandIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Package size={16} color={theme.colors.primary} strokeWidth={2.5} />
              </View>
              <ThemedText type="body" style={styles.brandName}>SwapSphere</ThemedText>
            </View>
            <ThemedText type="caption" style={[styles.footerVersion, { backgroundColor: theme.colors.surface }]}>v1.0.0</ThemedText>
          </View>
          <ThemedText type="caption" style={styles.footerTagline}>
            Premium peer-to-peer marketplace
          </ThemedText>
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
    zIndex: 100000,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    justifyContent: "center",
    alignItems: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: "#000",
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
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "500",
  },
  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionItems: {
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLast: {
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
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    fontWeight: "600",
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
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
  signOutSection: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  signOutButton: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    justifyContent: "center",
    alignItems: "center",
  },
  brandName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  footerVersion: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  footerTagline: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});
