import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/contexts/ThemeContext';

export type PaymentStatus = 'unnest' | 'created' | 'requires_action' | 'succeeded' | 'failed' | 'refunded' | 'canceled' | 'escrowed' | 'released';

interface TimelineStep {
  status: PaymentStatus;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface PaymentTimelineProps {
  currentStatus: PaymentStatus;
  completedAt?: Record<PaymentStatus, string>;
  updatedAt?: Record<PaymentStatus, string>;
}

const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ 
  currentStatus, 
  completedAt = {},
  updatedAt = {}
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getStepColor = (stepType: string) => {
    switch (stepType) {
      case 'success': return theme.colors.success;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'accent': return theme.colors.accent;
      case 'secondary': return theme.colors.secondary;
      default: return theme.colors.secondary;
    }
  };

  const timelineSteps: TimelineStep[] = [
    {
      status: 'unnest',
      label: 'Initiated',
      description: 'Payment process started',
      icon: 'time-outline',
      color: getStepColor('secondary'),
    },
    {
      status: 'created',
      label: 'Created',
      description: 'Payment created',
      icon: 'add-circle-outline',
      color: getStepColor('secondary'),
    },
    {
      status: 'requires_action',
      label: 'Action Required',
      description: 'Please complete payment',
      icon: 'alert-circle-outline',
      color: getStepColor('warning'),
    },
    {
      status: 'succeeded',
      label: 'Completed',
      description: 'Payment successful',
      icon: 'checkmark-circle-outline',
      color: getStepColor('success'),
    },
    {
      status: 'escrowed',
      label: 'In Escrow',
      description: 'Funds held securely',
      icon: 'shield-checkmark-outline',
      color: getStepColor('accent'),
    },
    {
      status: 'released',
      label: 'Released',
      description: 'Funds released to seller',
      icon: 'cash-outline',
      color: getStepColor('success'),
    },
  ];

  // Handle failure states
  if (currentStatus === 'failed' || currentStatus === 'canceled' || currentStatus === 'refunded') {
    const failureStep = {
      status: currentStatus,
      label: currentStatus === 'failed' ? 'Failed' : currentStatus === 'canceled' ? 'Canceled' : 'Refunded',
      description: currentStatus === 'failed' ? 'Payment failed' : currentStatus === 'canceled' ? 'Payment canceled' : 'Payment refunded',
      icon: (currentStatus === 'failed' ? 'close-circle-outline' as const : currentStatus === 'canceled' ? 'ban-outline' as const : 'refresh-outline' as const),
      color: getStepColor('error'),
    };
    
    const failureIndex = timelineSteps.findIndex(step => step.status === 'succeeded');
    if (failureIndex !== -1) {
      timelineSteps.splice(failureIndex, 1, failureStep);
    }
  }

  const getCurrentStepIndex = () => {
    return timelineSteps.findIndex(step => step.status === currentStatus);
  };

  const isStepCompleted = (stepStatus: PaymentStatus) => {
    const currentIndex = getCurrentStepIndex();
    const stepIndex = timelineSteps.findIndex(step => step.status === stepStatus);
    
    // Handle failure states
    if (currentStatus === 'failed' || currentStatus === 'canceled' || currentStatus === 'refunded') {
      return stepIndex < currentIndex || updatedAt[stepStatus];
    }
    
    return stepIndex < currentIndex || stepStatus === currentStatus || updatedAt[stepStatus];
  };

  const isStepActive = (stepStatus: PaymentStatus) => {
    return stepStatus === currentStatus;
  };

  const renderTimelineStep = (step: TimelineStep, index: number, isLast: boolean) => {
    const isCompleted = isStepCompleted(step.status);
    const isActive = isStepActive(step.status);
    
    return (
      <View key={step.status} style={styles.stepContainer}>
        <View style={styles.stepContent}>
          <View style={[
            styles.iconContainer,
            { 
              backgroundColor: isCompleted ? step.color : theme.colors.border,
              borderColor: isActive ? step.color : theme.colors.border,
            }
          ]}>
            <Ionicons 
              name={step.icon} 
              size={20} 
              color={isCompleted ? theme.colors.surface : isActive ? step.color : theme.colors.secondary} 
            />
          </View>
          
          <View style={styles.stepInfo}>
            <Text style={[
              styles.stepLabel,
              { 
                color: isActive ? step.color : isCompleted ? theme.colors.primary : theme.colors.secondary,
                fontWeight: isActive ? '600' : 'normal',
              }
            ]}>
              {step.label}
            </Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
            {updatedAt[step.status] && (
              <Text style={styles.timestamp}>
                {new Date(updatedAt[step.status]!).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
        
        {!isLast && (
          <View style={[
            styles.connector,
            { backgroundColor: isCompleted ? step.color : theme.colors.border }
          ]} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Status</Text>
      {timelineSteps.map((step, index) => 
        renderTimelineStep(step, index, index === timelineSteps.length - 1)
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 20,
  },
  stepContainer: {
    position: 'relative',
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.colors.secondary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
  connector: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: 20,
  },
});

export default PaymentTimeline;
