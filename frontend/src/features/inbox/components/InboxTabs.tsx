import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface InboxTabsProps {
  selectedTab: "all" | "unread";
  onSelectTab: (tab: "all" | "unread") => void;
  unreadCount: number;
}

export default function InboxTabs({
  selectedTab,
  onSelectTab,
  unreadCount,
}: InboxTabsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "all" && [
              styles.tabActive,
              { backgroundColor: theme.colors.accent || "#3B82F6" },
            ],
          ]}
          onPress={() => onSelectTab("all")}
          activeOpacity={0.7}
        >
          <ThemedText
            type="body"
            style={[
              styles.tabText,
              selectedTab === "all" && styles.tabTextActive
            ]}
          >
            All Messages
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === "unread" && [
              styles.tabActive,
              { backgroundColor: theme.colors.accent || "#3B82F6" },
            ],
          ]}
          onPress={() => onSelectTab("unread")}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <ThemedText
              type="body"
              style={[
                styles.tabText,
                selectedTab === "unread" && styles.tabTextActive
              ]}
            >
              Unread
            </ThemedText>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  tabActive: {
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
});
