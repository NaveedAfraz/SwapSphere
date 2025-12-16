import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: 'Chat Communication',
    description: 'Use chat to discuss payment and shipping details',
    icon: 'chatbubble-outline',
  },
  {
    id: 2,
    title: 'Exchange Contact Info',
    description: 'Share phone numbers for easier coordination',
    icon: 'call-outline',
  },
  {
    id: 3,
    title: 'Arrange Meeting/Shipping',
    description: 'Decide whether to meet in person or ship the item',
    icon: 'location-outline',
  },
  {
    id: 4,
    title: 'Handle Payment',
    description: 'Arrange payment directly between parties',
    icon: 'card-outline',
  },
  {
    id: 5,
    title: 'Complete Transaction',
    description: 'Meet or ship the item as agreed',
    icon: 'checkmark-circle-outline',
  },
  {
    id: 6,
    title: 'Leave Review',
    description: 'Rate each other after transaction is complete',
    icon: 'star-outline',
  },
];

export default function WorkflowDiagram() {
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>After Offer Acceptance - Next Steps</Text>
      <Text style={styles.subtitle}>Peer-to-peer transaction workflow</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {workflowSteps.map((step, index) => (
          <View key={step.id} style={styles.stepContainer}>
            {/* Step Circle */}
            <View style={styles.stepCircle}>
              <Ionicons 
                name={step.icon as any} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.stepNumber}>{step.id}</Text>
            </View>
            
            {/* Step Title */}
            <Text style={styles.stepTitle}>{step.title}</Text>
            
            {/* Step Description */}
            <Text style={styles.stepDescription}>{step.description}</Text>
            
            {/* Arrow */}
            {index < workflowSteps.length - 1 && (
              <View style={styles.arrowContainer}>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color="#3B82F6" 
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.safetyNote}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
        <Text style={styles.safetyText}>
          Remember to meet in safe public places and trust your instincts!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
  },
  stepContainer: {
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
    marginHorizontal: 4,
  },
  stepCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  arrowContainer: {
    position: 'absolute',
    right: -12,
    top: 25,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  safetyText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
    flex: 1,
  },
});
