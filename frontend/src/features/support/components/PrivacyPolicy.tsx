import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Interactions } from '@/src/constants/theme';

export default function PrivacyPolicy() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: December 2025</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.sectionText}>
              We collect information you provide directly to us, such as when you create an account, 
              list items, make offers, or communicate with other users.
            </Text>
            <Text style={styles.subsectionTitle}>Personal Information</Text>
            <Text style={styles.sectionText}>
              • Name, email address, and phone number{'\n'}
              • Profile information and photos{'\n'}
              • Location data (with your consent){'\n'}
              • Payment information (processed securely)
            </Text>
            <Text style={styles.subsectionTitle}>Usage Information</Text>
            <Text style={styles.sectionText}>
              • How you use our app and features{'\n'}
              • Device information and technical data{'\n'}
              • IP address and browsing history
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use the information we collect to:
            </Text>
            <Text style={styles.sectionText}>
              • Provide, maintain, and improve our services{'\n'}
              • Process transactions and send notifications{'\n'}
              • Communicate with you about your account{'\n'}
              • Detect and prevent fraud and abuse{'\n'}
              • Personalize your experience
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Information Sharing</Text>
            <Text style={styles.sectionText}>
              We do not sell your personal information. We only share information in these circumstances:
            </Text>
            <Text style={styles.sectionText}>
              • With other users for transaction completion{'\n'}
              • With service providers who help operate our services{'\n'}
              • When required by law or to protect our rights{'\n'}
              • With your explicit consent
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Data Security</Text>
            <Text style={styles.sectionText}>
              We implement appropriate security measures to protect your information, including:
            </Text>
            <Text style={styles.sectionText}>
              • Encryption of sensitive data{'\n'}
              • Secure payment processing{'\n'}
              • Regular security audits{'\n'}
              • Limited employee access to user data
            </Text>
            <Text style={styles.subsectionTitle}>Chat Security (Initial Stage)</Text>
            <Text style={styles.sectionText}>
              As SwapSphere is currently in its initial development stage, please note:
            </Text>
            <Text style={styles.sectionText}>
              • Chat messages are NOT end-to-end encrypted{'\n'}
              • Messages are stored securely on our servers{'\n'}
              • We plan to implement end-to-end encryption in future updates{'\n'}
              • Avoid sharing sensitive personal or financial information in chat{'\n'}
              • Use alternative secure methods for sharing payment details
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Your Rights</Text>
            <Text style={styles.sectionText}>
              You have the right to:
            </Text>
            <Text style={styles.sectionText}>
              • Access and update your personal information{'\n'}
              • Delete your account and data{'\n'}
              • Opt out of marketing communications{'\n'}
              • Request a copy of your data
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Contact Us</Text>
            <Text style={styles.sectionText}>
              If you have questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={styles.contactText}>
              Email: privacy@swapsphere.com{'\n'}
              Address: 123 Marketplace Street, San Francisco, CA 94102
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
});
