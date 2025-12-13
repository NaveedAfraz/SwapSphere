import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Interactions } from '@/src/constants/theme';

interface IssueType {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const issueTypes: IssueType[] = [
  {
    id: 'scam',
    title: 'Scam or Fraud',
    description: 'Fake listings, payment fraud, or suspicious behavior',
    icon: 'warning-outline',
  },
  {
    id: 'harassment',
    title: 'Harassment',
    description: 'Inappropriate messages, threats, or bullying',
    icon: 'person-remove-outline',
  },
  {
    id: 'fake_item',
    title: 'Fake or Misrepresented Item',
    description: 'Item doesn\'t match description or is counterfeit',
    icon: 'eye-off-outline',
  },
  {
    id: 'payment',
    title: 'Payment Issue',
    description: 'Problems with transactions, refunds, or charges',
    icon: 'card-outline',
  },
  {
    id: 'technical',
    title: 'Technical Problem',
    description: 'App bugs, crashes, or performance issues',
    icon: 'bug-outline',
  },
  {
    id: 'policy',
    title: 'Policy Violation',
    description: 'Breaking platform rules or terms of service',
    icon: 'document-text-outline',
  },
  {
    id: 'other',
    title: 'Other Issue',
    description: 'Any other problem not listed above',
    icon: 'ellipsis-horizontal-outline',
  },
];

export default function ReportIssue() {
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssue(issueId);
  };

  const handleAddAttachment = () => {
    // In a real app, this would open image picker
    Alert.alert('Add Attachment', 'This would open your photo library to add evidence.');
  };

  const handleSubmit = () => {
    if (!selectedIssue) {
      Alert.alert('Missing Information', 'Please select an issue type.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please provide a description of the issue.');
      return;
    }

    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We\'ll review it within 24 hours and contact you at your provided email.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedIssue('');
              setDescription('');
              setContactEmail('');
              setAttachments([]);
            },
          },
        ]
      );
    }, 2000);
  };

  const selectedIssueData = issueTypes.find(issue => issue.id === selectedIssue);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report an Issue</Text>
          <Text style={styles.headerSubtitle}>
            Help us keep SwapSphere safe by reporting problems
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What type of issue are you reporting?</Text>
          <View style={styles.issueTypes}>
            {issueTypes.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                style={[
                  styles.issueTypeCard,
                  selectedIssue === issue.id && styles.issueTypeCardSelected,
                ]}
                onPress={() => handleIssueSelect(issue.id)}
                activeOpacity={Interactions.activeOpacity}
              >
                <View style={styles.issueTypeContent}>
                  <Ionicons
                    name={issue.icon as any}
                    size={24}
                    color={selectedIssue === issue.id ? '#3B82F6' : '#6B7280'}
                  />
                  <View style={styles.issueTypeText}>
                    <Text
                      style={[
                        styles.issueTypeTitle,
                        selectedIssue === issue.id && styles.issueTypeTitleSelected,
                      ]}
                    >
                      {issue.title}
                    </Text>
                    <Text style={styles.issueTypeDescription}>{issue.description}</Text>
                  </View>
                </View>
                {selectedIssue === issue.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedIssue && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Describe the issue</Text>
              <Text style={styles.sectionSubtitle}>
                Please provide as much detail as possible, including:
                {selectedIssueData?.title.includes('User') || selectedIssueData?.title.includes('Harassment')
                  ? ' usernames, dates, and specific messages'
                  : selectedIssueData?.title.includes('Item')
                  ? ' listing details and what was wrong'
                  : ' what happened, when, and who was involved'}
              </Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Please describe the issue in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add evidence (optional)</Text>
              <Text style={styles.sectionSubtitle}>
                Screenshots or photos can help us investigate faster
              </Text>
              <TouchableOpacity
                style={styles.addAttachmentButton}
                onPress={handleAddAttachment}
                activeOpacity={Interactions.buttonOpacity}
              >
                <Ionicons name="camera-outline" size={20} color="#6B7280" />
                <Text style={styles.addAttachmentText}>Add Photo/Screenshot</Text>
              </TouchableOpacity>
              {attachments.length > 0 && (
                <View style={styles.attachments}>
                  {attachments.map((attachment, index) => (
                    <View key={index} style={styles.attachment}>
                      <Image source={{ uri: attachment }} style={styles.attachmentImage} />
                      <TouchableOpacity
                        style={styles.removeAttachment}
                        onPress={() => {
                          setAttachments(prev => prev.filter((_, i) => i !== index));
                        }}
                        activeOpacity={Interactions.buttonOpacity}
                      >
                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <Text style={styles.sectionSubtitle}>
                We may need to contact you for more information
              </Text>
              <TextInput
                style={styles.emailInput}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="Your email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.submitSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={Interactions.buttonOpacity}
              >
                {isSubmitting ? (
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                ) : (
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  issueTypes: {
    gap: 12,
  },
  issueTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  issueTypeCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  issueTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  issueTypeText: {
    marginLeft: 12,
    flex: 1,
  },
  issueTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  issueTypeTitleSelected: {
    color: '#3B82F6',
  },
  issueTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  selectedIndicator: {
    marginLeft: 12,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addAttachmentText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  attachment: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeAttachment: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  submitSection: {
    padding: 20,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
