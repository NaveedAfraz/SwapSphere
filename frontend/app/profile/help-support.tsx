import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create a listing?',
    answer: 'To create a listing, tap the "+" button on the home screen, select "Create Listing", upload photos, add details about your item, set a price, and publish.',
    category: 'Selling'
  },
  {
    id: '2',
    question: 'How does the payment system work?',
    answer: 'We use Stripe for secure payments. When you buy an item, the payment is held in escrow until you confirm receipt of the item.',
    category: 'Payments'
  },
  {
    id: '3',
    question: 'What if my item doesn\'t match the description?',
    answer: 'If your item doesn\'t match the description, you can open a dispute within 48 hours of delivery. Our team will review and help resolve the issue.',
    category: 'Disputes'
  },
  {
    id: '4',
    question: 'How do I become a verified seller?',
    answer: 'To become verified, complete your profile, add a profile photo, verify your email and phone number, and successfully complete 5 transactions.',
    category: 'Account'
  },
  {
    id: '5',
    question: 'What are the seller fees?',
    answer: 'We charge a 5% fee on completed sales. This fee covers payment processing, platform maintenance, and customer support.',
    category: 'Fees'
  }
];

export default function HelpSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState('');

  const categories = ['all', 'Selling', 'Payments', 'Disputes', 'Account', 'Fees'];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const handleContactSupport = () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    Alert.alert('Support Request Sent', 'We\'ll get back to you within 24 hours.');
    setSupportMessage('');
  };

  const renderFAQItem = (item: FAQItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.faqItem,
        expandedItem === item.id && styles.faqItemExpanded
      ]}
      onPress={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <View style={styles.questionContainer}>
          <View style={styles.questionIcon}>
            <Ionicons 
              name="help-circle-outline" 
              size={20} 
              color="#3B82F6" 
            />
          </View>
          <Text style={styles.faqQuestion}>{item.question}</Text>
        </View>
        <View style={[
          styles.chevronContainer,
          expandedItem === item.id && styles.chevronContainerRotated
        ]}>
          <Ionicons 
            name={expandedItem === item.id ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#6B7280" 
          />
        </View>
      </View>
      
      {expandedItem === item.id && (
        <View style={styles.faqAnswer}>
          <View style={styles.answerContent}>
            <Text style={styles.answerText}>{item.answer}</Text>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag-outline" size={12} color="#6366F1" style={styles.categoryIcon} />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
   
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>We're here to help you succeed</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="book-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>User Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="chatbubble-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Live Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="call-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Call Us</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.categoryFilter}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.faqList}>
            {filteredFAQs.map(renderFAQItem)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactOption}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@swapsphere.com</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactOption}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Response Time</Text>
                <Text style={styles.contactValue}>Within 24 hours</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Send us a message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or question..."
              multiline
              numberOfLines={4}
              value={supportMessage}
              onChangeText={setSupportMessage}
              textAlignVertical="top"
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleContactSupport}
            >
              <Ionicons name="send-outline" size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#3B82F6',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  faqItemExpanded: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderColor: '#BFDBFE',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  questionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronContainerRotated: {
    backgroundColor: '#EFF6FF',
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FAFBFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  answerContent: {
    position: 'relative',
  },
  answerText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  contactOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactInfo: {
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactValue: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    marginBottom: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
