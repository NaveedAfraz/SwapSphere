import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Interactions } from "@/src/constants/theme";
import WorkflowDiagram from "@/src/features/support/components/WorkflowDiagram";
import { ThemedView } from "@/src/components/ThemedView";

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const supportOptions = [
    {
      id: "chat",
      title: "Chat with Support",
      description: "Get instant help from our AI assistant",
      icon: "chatbubble-ellipses-outline",
      color: "#3B82F6",
      route: "/support/chat" as const,
    },
    {
      id: "faq",
      title: "FAQ",
      description: "Find answers to common questions",
      icon: "help-circle-outline",
      color: "#10B981",
      route: "/support/faq" as const,
    },
    {
      id: "report",
      title: "Report an Issue",
      description: "Report problems or suspicious activity",
      icon: "warning-outline",
      color: "#F59E0B",
      route: "/support/report" as const,
    },
    {
      id: "email",
      title: "Email Support",
      description: "Send us a detailed message",
      icon: "mail-outline",
      color: "#6B7280",
      action: () => Linking.openURL("mailto:support@swapsphere.com"),
    },
    {
      id: "phone",
      title: "Call Support",
      description: "Speak with our support team",
      icon: "call-outline",
      color: "#8B5CF6",
      action: () => Linking.openURL("tel:+1234567890"),
    },
  ];

  const quickLinks = [
    {
      id: "terms",
      title: "Terms of Service",
      description: "Read our terms and conditions",
      icon: "document-text-outline",
      route: "/support/terms" as const,
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      description: "Understand how we protect your data",
      icon: "lock-closed-outline",
      route: "/support/privacy" as const,
    },
  ];

  const handleOptionPress = (option: (typeof supportOptions)[0]) => {
    if (option.route) {
      router.push(option.route);
    } else if (option.action) {
      option.action();
    }
  };

  const renderSupportOption = (option: (typeof supportOptions)[0]) => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionCard}
      onPress={() => handleOptionPress(option)}
      activeOpacity={Interactions.activeOpacity}
    >
      <View
        style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}
      >
        <Ionicons name={option.icon as any} size={24} color={option.color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderQuickLink = (link: (typeof quickLinks)[0]) => (
    <TouchableOpacity
      key={link.id}
      style={styles.quickLinkCard}
      onPress={() => {
        if (link.route) {
          router.push(link.route);
        }
      }}
      activeOpacity={Interactions.activeOpacity}
    >
      <View style={styles.quickLinkContent}>
        <Ionicons name={link.icon as any} size={20} color="#6B7280" />
        <View style={styles.quickLinkText}>
          <Text style={styles.quickLinkTitle}>{link.title}</Text>
          <Text style={styles.quickLinkDescription}>{link.description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            style={styles.backButton}
            activeOpacity={Interactions.buttonOpacity}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>

        <WorkflowDiagram />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How can we help you?</Text>
          <View style={styles.optionsContainer}>
            {supportOptions.map(renderSupportOption)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksContainer}>
            {quickLinks.map(renderQuickLink)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.contactText}>support@swapsphere.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.contactText}>1-800-SWAP-HELP</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.contactText}>
                24/7 AI Support | 9AM-6PM Human Support
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Can't find what you're looking for? Our AI chat assistant is
            available 24/7 to help you.
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  quickLinksContainer: {
    gap: 12,
  },
  quickLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickLinkContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  quickLinkText: {
    marginLeft: 12,
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  quickLinkDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  contactInfo: {
    gap: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactText: {
    fontSize: 15,
    color: "#111827",
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
