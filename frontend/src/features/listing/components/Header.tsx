import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Menu, Bell, Camera, Search, X } from "lucide-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMenuPress?: () => void;
  unreadCount?: number;
  onNotificationPress?: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  onMenuPress,
  unreadCount = 0,
  onNotificationPress,
}: HeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[styles.menuBtn, { backgroundColor: theme.colors.background }]}
          onPress={onMenuPress}
        >
          <Menu size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.logo, { color: theme.colors.primary }]}>
          SwapSphere
        </Text>
        <TouchableOpacity
          style={[
            styles.notificationBtn,
            { backgroundColor: theme.colors.background },
          ]}
          onPress={onNotificationPress}
        >
          <Bell size={24} color={theme.colors.primary} />
          {unreadCount > 0 && (
            <View
              style={[styles.badge, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Search
          size={20}
          color={theme.colors.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.primary,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Search items..."
          placeholderTextColor={theme.colors.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={20} color={theme.colors.secondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.cameraBtn,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Camera size={20} color={theme.colors.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
  },
  cameraBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
});
