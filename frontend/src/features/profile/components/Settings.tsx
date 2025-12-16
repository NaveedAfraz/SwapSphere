import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  AnimatedThemedView,
  AnimatedThemedText,
} from "@/src/components/ThemedView";

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: "toggle" | "navigation" | "action";
  value?: boolean;
  onPress?: () => void;
  isDestructive?: boolean;
}

export default function Settings() {
  const { theme, isDark, toggleTheme, animatedValue, isTransitioning } =
    useTheme();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  // Animate the dark mode toggle
  const handleDarkModeToggle = () => {
    // Add haptic feedback if available
    if (Platform.OS === "ios") {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleTheme();
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => {} },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {} },
    ]);
  };

  const settings: SettingItem[] = [
    {
      id: "notifications",
      title: "Push Notifications",
      subtitle: "Messages, offers & updates",
      icon: "notifications-outline",
      type: "toggle",
      value: notifications,
      onPress: () => setNotifications(!notifications),
    },
    {
      id: "location",
      title: "Location Services",
      subtitle: "Nearby listings & pickup",
      icon: "location-outline",
      type: "toggle",
      value: locationServices,
      onPress: () => setLocationServices(!locationServices),
    },
    {
      id: "darkMode",
      title: "Dark Mode",
      subtitle: isTransitioning ? "Switching..." : "Reduce eye strain",
      icon: "moon-outline",
      type: "toggle",
      value: isDark,
      onPress: handleDarkModeToggle,
    },
    {
      id: "autoBackup",
      title: "Auto Backup",
      subtitle: "Secure cloud backup",
      icon: "cloud-upload-outline",
      type: "toggle",
      value: autoBackup,
      onPress: () => setAutoBackup(!autoBackup),
    },

    {
      id: "editProfile",
      title: "Edit Profile",
      subtitle: "Personal information",
      icon: "person-outline",
      type: "navigation",
    },
    {
      id: "paymentMethods",
      title: "Payment Methods",
      subtitle: "Cards & billing",
      icon: "card-outline",
      type: "navigation",
    },
    {
      id: "security",
      title: "Security",
      subtitle: "Password & 2FA",
      icon: "shield-outline",
      type: "navigation",
    },
    {
      id: "privacy",
      title: "Privacy",
      subtitle: "Data & permissions",
      icon: "lock-closed-outline",
      type: "navigation",
    },

    {
      id: "help",
      title: "Help & Support",
      subtitle: "Contact us",
      icon: "help-circle-outline",
      type: "navigation",
    },
    {
      id: "about",
      title: "About",
      subtitle: "Version & policies",
      icon: "information-circle-outline",
      type: "navigation",
    },

    {
      id: "signOut",
      title: "Sign Out",
      icon: "log-out-outline",
      type: "action",
      onPress: handleSignOut,
    },
    {
      id: "deleteAccount",
      title: "Delete Account",
      subtitle: "Permanent removal",
      icon: "trash-outline",
      type: "action",
      onPress: handleDeleteAccount,
      isDestructive: true,
    },
  ];

  const renderItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.settingItem, item.isDestructive && styles.destructiveItem]}
      onPress={item.onPress}
      disabled={item.type === "toggle"}
      activeOpacity={Interactions.buttonOpacity}
    >
      <View style={styles.left}>
        <Ionicons
          name={item.icon as any}
          size={22}
          color={
            item.isDestructive ? theme.colors.error : theme.colors.secondary
          }
        />
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.primary },
              item.isDestructive && { color: theme.colors.error },
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>

      {item.type === "toggle" ? (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primary,
          }}
          thumbColor={theme.colors.surface}
        />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.colors.border}
        />
      )}
    </TouchableOpacity>
  );

  const section = (title: string, ids: string[]) => (
    <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
        {title}
      </Text>
      {settings.filter((s) => ids.includes(s.id)).map(renderItem)}
    </View>
  );

  return (
    <AnimatedThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {section("Preferences", [
          "notifications",
          "location",
          "darkMode",
          "autoBackup",
        ])}
        {section("Account", [
          "editProfile",
          "paymentMethods",
          "security",
          "privacy",
        ])}
        {section("Support", ["help", "about"])}
        {section("Actions", ["signOut", "deleteAccount"])}

        <AnimatedThemedView style={styles.footer}>
          <AnimatedThemedText style={styles.footerText}>
            SwapSphere v1.0.0
          </AnimatedThemedText>
          <AnimatedThemedText style={styles.footerText}>
            Premium peer-to-peer marketplace
          </AnimatedThemedText>
        </AnimatedThemedView>
      </ScrollView>
    </AnimatedThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  section: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    paddingVertical: 25,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 12,
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },

  destructiveItem: {
    backgroundColor: "transparent",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  content: {
    marginLeft: 16,
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "500",
  },

  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  footer: {
    alignItems: "center",
    paddingVertical: 32,
  },

  footerText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
});
