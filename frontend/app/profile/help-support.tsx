import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/contexts/ThemeContext";
import { ThemedText } from "@/src/components/GlobalThemeComponents";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "How do I create a listing?",
    answer:
      'To create a listing, tap the "+" button on the home screen, select "Create Listing", upload photos, add details about your item, set a price, and publish.',
    category: "Selling",
  },
  {
    id: "2",
    question: "How does the payment system work?",
    answer:
      "We use Stripe for secure payments. When you buy an item, the payment is held in escrow until you confirm receipt of the item.",
    category: "Payments",
  },
  {
    id: "3",
    question: "What if my item doesn't match the description?",
    answer:
      "If your item doesn't match the description, you can open a dispute within 48 hours of delivery. Our team will review and help resolve the issue.",
    category: "Disputes",
  },
  {
    id: "4",
    question: "How do I become a verified seller?",
    answer:
      "To become verified, complete your profile, add a profile photo, verify your email and phone number, and successfully complete 5 transactions.",
    category: "Account",
  },
  {
    id: "5",
    question: "What are the seller fees?",
    answer:
      "We charge a 5% fee on completed sales. This fee covers payment processing, platform maintenance, and customer support.",
    category: "Fees",
  },
];

export default function HelpSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState("");
  const { theme } = useTheme();

  // Animated values for FAQ items
  const animatedValues = React.useRef<{ [key: string]: Animated.Value }>({});

  const initializeAnimatedValue = (id: string) => {
    if (!animatedValues.current[id]) {
      animatedValues.current[id] = new Animated.Value(0);
    }
    return animatedValues.current[id];
  };

  const toggleFAQItem = (id: string) => {
    const animatedValue = initializeAnimatedValue(id);

    if (expandedItem === id) {
      // Collapse
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setExpandedItem(null);
      });
    } else {
      // Expand
      setExpandedItem(id);
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const categories = [
    "all",
    "Selling",
    "Payments",
    "Disputes",
    "Account",
    "Fees",
  ];

  const filteredFAQs =
    selectedCategory === "all"
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory);

  const handleContactSupport = () => {
    if (!supportMessage.trim()) {
      Alert.alert("Error", "Please enter your message");
      return;
    }
    Alert.alert(
      "Support Request Sent",
      "We'll get back to you within 24 hours."
    );
    setSupportMessage("");
  };

  const renderFAQItem = (item: FAQItem) => {
    const animatedValue = initializeAnimatedValue(item.id);
    const heightAnim = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 150], // Approximate height of expanded content
    });
    const opacityAnim = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.faqItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          expandedItem === item.id && { borderColor: theme.colors.primary },
        ]}
        onPress={() => toggleFAQItem(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeader}>
          <View style={styles.questionContainer}>
            <View
              style={[
                styles.questionIcon,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <ThemedText type="body" style={styles.faqQuestion}>
              {item.question}
            </ThemedText>
          </View>
          <View
            style={[
              styles.chevronContainer,
              { backgroundColor: theme.colors.background },
              expandedItem === item.id && {
                backgroundColor: theme.colors.primary,
              },
            ]}
          >
            <Ionicons
              name={expandedItem === item.id ? "chevron-up" : "chevron-down"}
              size={20}
              color={
                expandedItem === item.id ? "#FFFFFF" : theme.colors.secondary
              }
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.faqAnswer,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
              height: heightAnim,
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.answerContent}>
            <ThemedText type="body" style={styles.answerText}>
              {item.answer}
            </ThemedText>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Ionicons
                name="pricetag-outline"
                size={12}
                color={theme.colors.primary}
                style={styles.categoryIcon}
              />
              <ThemedText type="caption" style={styles.categoryText}>
                {item.category}
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <ThemedText type="heading" style={styles.title}>
            Help & Support
          </ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            We're here to help you succeed
          </ThemedText>
        </View>

        <View
          style={[
            styles.quickActions,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.quickAction,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={24}
              color={theme.colors.primary}
            />
            <ThemedText type="caption" style={styles.quickActionText}>
              User Guide
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAction,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={theme.colors.primary}
            />
            <ThemedText type="caption" style={styles.quickActionText}>
              Live Chat
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAction,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={24}
              color={theme.colors.primary}
            />
            <ThemedText type="caption" style={styles.quickActionText}>
              Call Us
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            Frequently Asked Questions
          </ThemedText>

          <View style={styles.categoryFilter}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === category
                        ? theme.colors.primary
                        : theme.colors.background,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <ThemedText
                  type="caption"
                  style={[
                    styles.categoryChipText,
                    selectedCategory === category && { color: "#FFFFFF" },
                  ]}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.faqList}>{filteredFAQs.map(renderFAQItem)}</View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subheading" style={styles.sectionTitle}>
            Contact Support
          </ThemedText>

          <View
            style={[
              styles.contactOptions,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.contactOption,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.secondary}
              />
              <View style={styles.contactInfo}>
                <ThemedText type="body" style={styles.contactLabel}>
                  Email
                </ThemedText>
                <ThemedText type="caption" style={styles.contactValue}>
                  support@swapsphere.com
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.contactOption,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.colors.secondary}
              />
              <View style={styles.contactInfo}>
                <ThemedText type="body" style={styles.contactLabel}>
                  Response Time
                </ThemedText>
                <ThemedText type="caption" style={styles.contactValue}>
                  Within 24 hours
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.messageContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <ThemedText type="body" style={styles.messageLabel}>
              Send us a message
            </ThemedText>
            <TextInput
              style={[
                styles.messageInput,
                { borderColor: theme.colors.border, color: "#111827" },
              ]}
              placeholder="Describe your issue or question..."
              multiline
              numberOfLines={4}
              value={supportMessage}
              onChangeText={setSupportMessage}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleContactSupport}
            >
              <Ionicons name="send-outline" size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  categoryFilter: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  faqList: {
    borderRadius: 12,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  faqItem: {
    borderRadius: 16,

    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 0,
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  questionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingTop: 20,

    borderTopWidth: 1,
  },
  answerContent: {
    position: "relative",
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  contactOptions: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  contactInfo: {
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  contactValue: {
    fontSize: 14,
    marginTop: 2,
  },
  messageContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 12,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});
