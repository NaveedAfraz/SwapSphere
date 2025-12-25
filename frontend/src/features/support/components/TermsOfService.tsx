import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedView, ThemedText } from '@/src/components/ThemedView';

export default function TermsOfService() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>Terms of Service</ThemedText>
          <ThemedText color="secondary" style={styles.lastUpdated}>Last updated: December 2025</ThemedText>
          
          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>1. Acceptance of Terms</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              By using SwapSphere, you agree to these Terms of Service and our Privacy Policy. 
              If you do not agree to these terms, please do not use our service.
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>2. Account Responsibilities</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              You are responsible for:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Providing accurate and complete information{'\n'}
              • Maintaining the security of your account{'\n'}
              • All activities that occur under your account{'\n'}
              • Notifying us immediately of unauthorized use
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>3. Prohibited Activities</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              You may not use SwapSphere to:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Sell illegal or prohibited items{'\n'}
              • Post false, misleading, or fraudulent listings{'\n'}
              • Harass, abuse, or harm other users{'\n'}
              • Violate any applicable laws or regulations{'\n'}
              • Attempt to gain unauthorized access to our systems
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>4. Listing Guidelines</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              All listings must:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Accurately describe the item being sold{'\n'}
              • Include clear and honest photos{'\n'}
              • Comply with our prohibited items policy{'\n'}
              • Not contain offensive or inappropriate content
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>5. Transactions and Payments</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              SwapSphere facilitates peer-to-peer transactions including:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Cash sales and purchases{'\n'}
              • Direct item swaps (barter/trade){'\n'}
              • Hybrid transactions (cash + swap items){'\n'}
              • Payment arrangements are made between users directly{'\n'}
              • We charge a commission on successful cash transactions{'\n'}
              • Swap transactions are commission-free{'\n'}
              • All transactions are final unless otherwise agreed
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>6. Fees and Commissions</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              Our fee structure:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • No listing fees{'\n'}
              • **NO COMMISSION until April 2026** (Launch Promotion){'\n'}
              • After April 2026: 3% commission on cash sales under $500{'\n'}
              • After April 2026: 2% commission on cash sales over $500{'\n'}
              • **Direct swaps are always commission-free**{'\n'}
              • Hybrid transactions: commission only on cash portion{'\n'}
              • Payment processing fees may apply to cash transactions{'\n'}
              • Fees are automatically deducted from successful transactions
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              This promotional period applies to all cash transactions completed before April 30, 2026.
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>7. User Ratings and Reviews</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Users can rate and review each other after transactions{'\n'}
              • Ratings must be honest and based on actual experience{'\n'}
              • Fake reviews are prohibited and may result in account suspension{'\n'}
              • Your rating affects your visibility on the platform
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>8. Swap Transactions and In-Person Exchanges</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              For swap and hybrid transactions:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Meet in safe, public locations during daylight hours{'\n'}
              • Inspect items thoroughly before completing the exchange{'\n'}
              • Bring a friend for additional safety when possible{'\n'}
              • Verify item condition matches the listing description{'\n'}
              • Document the condition of high-value items with photos{'\n'}
              • Exchange items simultaneously to prevent disputes{'\n'}
              • Both parties must be 18 years or older for in-person exchanges{'\n'}
              • Follow local laws and regulations for item exchanges
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              SwapSphere is not responsible for in-person exchanges, disputes, or item condition issues. Users exchange at their own risk.
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>9. Dispute Resolution</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              In case of disputes:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • First attempt to resolve directly with the other party{'\n'}
              • Use our chat system for communication and documentation{'\n'}
              • For swap disputes: provide photos of item condition{'\n'}
              • Report serious issues to our support team{'\n'}
              • We may mediate disputes but are not responsible for user conflicts{'\n'}
              • Cash transactions may be eligible for payment dispute resolution{'\n'}
              • Swap transactions are final once completed in person
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>10. Intellectual Property</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • You retain ownership of content you post{'\n'}
              • You grant us license to use content for service operation{'\n'}
              • Do not post content you don't have rights to{'\n'}
              • Respect intellectual property rights of others
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>11. Account Termination</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              We may suspend or terminate accounts for:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • Violation of these terms{'\n'}
              • Fraudulent or harmful activities{'\n'}
              • Failure to complete agreed swap transactions{'\n'}
              • Misrepresentation of item condition{'\n'}
              • Inactive accounts (after 12 months){'\n'}
              • At your request (account deletion)
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>12. Limitation of Liability</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              SwapSphere is provided "as is" and we are not liable for:
            </ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              • User-to-user transactions and disputes{'\n'}
              • Item quality or accuracy of descriptions{'\n'}
              • Losses from fraudulent activities{'\n'}
              • In-person exchange safety or incidents{'\n'}
              • Damage, loss, or theft during swap transactions{'\n'}
              • Service interruptions or technical issues
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <ThemedText color="primary" style={styles.sectionTitle}>13. Contact Information</ThemedText>
            <ThemedText color="secondary" style={styles.sectionText}>
              For questions about these Terms of Service:
            </ThemedText>
            <ThemedText color="secondary" style={styles.contactText}>
              Email: legal@swapsphere.com{'\n'}
              Address: 123 Marketplace Street, San Francisco, CA 94102
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
