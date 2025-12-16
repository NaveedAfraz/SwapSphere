import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Interactions } from '@/src/constants/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedView } from '@/src/components/ThemedView';

export default function TermsOfService() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Terms of Service</Text>
          <Text style={[styles.lastUpdated, { color: theme.colors.secondary }]}>Last updated: December 2025</Text>
          
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>1. Acceptance of Terms</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              By using SwapSphere, you agree to these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our service.
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>2. Account Responsibilities</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              You are responsible for:
            </Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              • Providing accurate and complete information{'\n'}
              • Maintaining the security of your account{'\n'}
              • All activities that occur under your account{'\n'}
              • Notifying us immediately of unauthorized use
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>3. Prohibited Activities</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              You may not use SwapSphere to:
            </Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              • Sell illegal or prohibited items{'\n'}
              • Post false, misleading, or fraudulent listings{'\n'}
              • Harass, abuse, or harm other users{'\n'}
              • Violate any applicable laws or regulations{'\n'}
              • Attempt to gain unauthorized access to our systems
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>4. Listing Guidelines</Text>
            <Text style={styles.sectionText}>
              All listings must:
            </Text>
            <Text style={styles.sectionText}>
              • Accurately describe the item being sold{'\n'}
              • Include clear and honest photos{'\n'}
              • Comply with our prohibited items policy{'\n'}
              • Not contain offensive or inappropriate content
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Transactions and Payments</Text>
            <Text style={styles.sectionText}>
              • SwapSphere facilitates peer-to-peer transactions{'\n'}
              • Payment arrangements are made between users directly{'\n'}
              • We charge a commission on successful sales{'\n'}
              • All transactions are final unless otherwise agreed
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Fees and Commissions</Text>
            <Text style={styles.sectionText}>
              Our fee structure:
            </Text>
            <Text style={styles.sectionText}>
              • No listing fees{'\n'}
              • **NO COMMISSION until April 2026** (Launch Promotion){'\n'}
              • After April 2026: 3% commission on sales under $500{'\n'}
              • After April 2026: 2% commission on sales over $500{'\n'}
              • Payment processing fees may apply{'\n'}
              • Fees are automatically deducted from successful transactions
            </Text>
            <Text style={styles.sectionText}>
              This promotional period applies to all transactions completed before April 30, 2026.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. User Ratings and Reviews</Text>
            <Text style={styles.sectionText}>
              • Users can rate and review each other after transactions{'\n'}
              • Ratings must be honest and based on actual experience{'\n'}
              • Fake reviews are prohibited and may result in account suspension{'\n'}
              • Your rating affects your visibility on the platform
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Dispute Resolution</Text>
            <Text style={styles.sectionText}>
              In case of disputes:
            </Text>
            <Text style={styles.sectionText}>
              • First attempt to resolve directly with the other party{'\n'}
              • Use our chat system for communication{'\n'}
              • Report serious issues to our support team{'\n'}
              • We may mediate disputes but are not responsible for user conflicts
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>9. Intellectual Property</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              • You retain ownership of content you post{'\n'}
              • You grant us license to use content for service operation{'\n'}
              • Do not post content you don't have rights to{'\n'}
              • Respect intellectual property rights of others
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>10. Account Termination</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              We may suspend or terminate accounts for:
            </Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              • Violation of these terms{'\n'}
              • Fraudulent or harmful activities{'\n'}
              • Inactive accounts (after 12 months){'\n'}
              • At your request (account deletion)
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>11. Limitation of Liability</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              SwapSphere is provided "as is" and we are not liable for:
            </Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              • User-to-user transactions and disputes{'\n'}
              • Item quality or accuracy of descriptions{'\n'}
              • Losses from fraudulent activities{'\n'}
              • Service interruptions or technical issues
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>12. Contact Information</Text>
            <Text style={[styles.sectionText, { color: theme.colors.secondary }]}>
              For questions about these Terms of Service:
            </Text>
            <Text style={[styles.contactText, { color: theme.colors.secondary }]}>
              Email: legal@swapsphere.com{'\n'}
              Address: 123 Marketplace Street, San Francisco, CA 94102
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
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
