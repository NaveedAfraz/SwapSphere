import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from '@/src/constants/theme';

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
  dangerBg: "#FEF2F2",
};

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
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

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
      subtitle: "Reduce eye strain",
      icon: "moon-outline",
      type: "toggle",
      value: darkMode,
      onPress: () => setDarkMode(!darkMode),
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
          color={item.isDestructive ? COLORS.error : COLORS.muted}
        />
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              item.isDestructive && { color: COLORS.error },
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>

      {item.type === "toggle" ? (
        <Switch
          value={item.value}
          onValueChange={item.onPress}
          trackColor={{ false: COLORS.surface, true: COLORS.accent }}
          thumbColor={COLORS.white}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.surface} />
      )}
    </TouchableOpacity>
  );

  const section = (title: string, ids: string[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {settings.filter((s) => ids.includes(s.id)).map(renderItem)}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      <View style={styles.footer}>
        <Text style={styles.footerText}>SwapSphere v1.0.0</Text>
        <Text style={styles.footerText}>Premium peer-to-peer marketplace</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.chipBg,
  },

  destructiveItem: {
    backgroundColor: COLORS.dangerBg,
  },

  left: { flexDirection: "row", alignItems: "center", flex: 1 },

  content: { marginLeft: 12, flex: 1 },

  title: { fontSize: 16, fontWeight: "600", color: COLORS.dark },

  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },

  footer: { alignItems: "center", paddingVertical: 40 },

  footerText: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
});
