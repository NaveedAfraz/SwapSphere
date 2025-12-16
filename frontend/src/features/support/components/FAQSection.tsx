import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- Types & Data ---
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
      'To create a listing: 1) Tap the "+" button on the home screen, 2) Select "Create Listing", 3) Upload clear photos of your item, 4) Fill in details like title, description, and price, 5) Choose appropriate category, 6) Review and publish your listing.',
    category: "Selling",
  },
  {
    id: "2",
    question: "How do I make an offer on an item?",
    answer:
      'To make an offer: 1) Find an item you like, 2) Tap the "Make Offer" button, 3) Enter your offer price, 4) Add a message to the seller (optional), 5) Submit your offer. The seller can accept, reject, or counter your offer.',
    category: "Buying",
  },
  {
    id: "3",
    question: "What happens after my offer is accepted?",
    answer:
      'After offer acceptance in our peer-to-peer marketplace: 1) **Chat Communication** - Use the chat to discuss payment and shipping details with the other party, 2) **Exchange Contact Info** - Share phone numbers for easier coordination, 3) **Arrange Meeting/Shipping** - Decide whether to meet in person or ship the item, 4) **Handle Payment** - Arrange payment directly between parties (cash, digital transfer, etc.), 5) **Complete Transaction** - Meet or ship the item as agreed, 6) **Leave Review** - Rate each other after the transaction is complete. Remember to meet in safe public places and trust your instincts!',
    category: "Buying",
  },
  {
    id: "4",
    question: "Is my payment information secure?",
    answer:
      "Yes, we use industry-standard encryption and secure payment processing. Your payment details are never shared with sellers. We use escrow services to protect both buyers and sellers during transactions.",
    category: "Payments",
  },
  {
    id: "5",
    question: "How do I report a suspicious user?",
    answer:
      'To report a user: 1) Go to their profile, 2) Tap the menu button (three dots), 3) Select "Report User", 4) Choose the reason for reporting, 5) Provide details about the issue. We review all reports within 24 hours.',
    category: "Safety",
  },
  {
    id: "6",
    question: "What if an item doesn't match its description?",
    answer:
      "If an item doesn't match its description: 1) Contact the seller through our chat system first, 2) If unresolved, open a dispute within 48 hours of delivery, 3) Provide photos showing the discrepancy, 4) Our support team will mediate the situation.",
    category: "Disputes",
  },
  {
    id: "7",
    question: "How do ratings work?",
    answer:
      "After completing a transaction, both buyer and seller can rate each other and leave a review. Ratings are based on communication, item accuracy, and overall experience. Your overall rating affects your visibility and trust score on the platform.",
    category: "Reviews",
  },
  {
    id: "8",
    question: "Can I delete my account?",
    answer:
      "Yes, you can delete your account from Settings > Account > Delete Account. Please note: 1) All your listings will be removed, 2) Active transactions will be canceled, 3) Your data will be permanently deleted after 30 days.",
    category: "Account",
  },
  {
    id: "9",
    question: "What are the fees for selling?",
    answer:
      "SwapSphere charges: 1) No listing fees, 2) **NO COMMISSION until April 2026** (Launch Promotion!), 3) After April 2026: 3% commission on sales under $500, 4) After April 2026: 2% commission on sales over $500, 5) Payment processing fees may apply. No fees for buyers.",
    category: "Payments",
  },
];

const categories = [
  "All",
  "Account",
  "Buying",
  "Selling",
  "Payments",
  "Safety",
  "Disputes",
  "Reviews",
];

// --- Component ---
export default function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();

  const filteredFAQs = faqData.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderFAQItem = ({ item }: { item: FAQItem }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={() => toggleExpanded(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.questionContent}>
          <Text style={styles.questionText}>{item.question}</Text>
          <Text style={styles.categoryBadge}>{item.category}</Text>
        </View>
        <Ionicons
          name={expandedItems.has(item.id) ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>

      {expandedItems.has(item.id) && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        // Only apply bottom padding. Top is handled by Stack Header.
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
    >
      {/* Search Section */}
      <View style={styles.searchContainer}>
        <Text style={styles.sectionTitle}>How can we help?</Text>
        <View style={styles.searchInputWrapper}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for answers..."
            placeholderTextColor="#9CA3AF"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.faqList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.faqListContent}
      >
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((item) => (
            <View key={item.id}>{renderFAQItem({ item })}</View>
          ))
        ) : (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your search terms
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#F9FAFB", // Blend with background
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    // Light shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0, // Fix alignment on Android
  },

  // Category Styles
  categoriesWrapper: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },

  // List Styles
  faqList: {
    flex: 1,
  },
  faqListContent: {
    padding: 20,
    paddingTop: 8,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  questionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  questionContent: {
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
    lineHeight: 22,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    alignSelf: "flex-start",
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  answerText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
  },

  // Empty State Styles
  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
