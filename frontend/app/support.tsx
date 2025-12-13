import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SupportScreen() {
  const router = useRouter();

  const handleContactSupport = () => {
    Alert.alert("Contact Support", "How would you like to contact support?", [
      { text: "Cancel", style: "cancel" },
      { text: "Email", onPress: () => console.log("Email support") },
      { text: "Chat", onPress: () => console.log("Chat support") },
    ]);
  };

  const handleFAQ = () => {
    console.log("Open FAQ");
  };

  const handleReportIssue = () => {
    console.log("Report issue");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.supportItem}
            onPress={handleContactSupport}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Contact Support</Text>
              <Text style={styles.supportDescription}>
                Get help from our support team
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportItem} onPress={handleFAQ}>
            <View style={styles.iconContainer}>
              <Ionicons name="help-circle-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>FAQ</Text>
              <Text style={styles.supportDescription}>
                Frequently asked questions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportItem}
            onPress={handleReportIssue}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="flag-outline" size={24} color="#3B82F6" />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Report an Issue</Text>
              <Text style={styles.supportDescription}>
                Report problems or violations
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          <View style={styles.helpItem}>
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.helpText}>
              Average response time: 2-4 hours
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text style={styles.helpText}>Email: support@swapsphere.com</Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
            <Text style={styles.helpText}>Available 24/7</Text>
          </View>
        </View>
      </ScrollView>
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
    alignItems: "center",
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  supportDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  helpText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 12,
  },
});
