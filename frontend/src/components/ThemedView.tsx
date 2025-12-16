import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

interface ThemedViewProps {
  children: React.ReactNode;
  style?: any;
}

export const ThemedView: React.FC<ThemedViewProps> = ({ children, style }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[{ backgroundColor: theme.colors.background }, style]}>
      {children}
    </View>
  );
};

interface ThemedTextProps {
  children: React.ReactNode;
  style?: any;
  color?: 'primary' | 'secondary' | 'accent' | 'error' | 'success' | 'warning';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ children, style, color = 'primary' }) => {
  const { theme } = useTheme();
  
  return (
    <Text style={[{ color: theme.colors[color] }, style]}>
      {children}
    </Text>
  );
};

interface ThemedTouchableOpacityProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
}

export const ThemedTouchableOpacity: React.FC<ThemedTouchableOpacityProps> = ({ 
  children, 
  style, 
  onPress, 
  disabled, 
  activeOpacity = 0.7 
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[{ backgroundColor: theme.colors.surface }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
    >
      {children}
    </TouchableOpacity>
  );
};

// Animated version for smooth transitions
export const AnimatedThemedView: React.FC<ThemedViewProps> = ({ children, style }) => {
  const { animatedValue, theme } = useTheme();
  
  return (
    <Animated.View style={[{ backgroundColor: theme.colors.background }, style]}>
      {children}
    </Animated.View>
  );
};

export const AnimatedThemedText: React.FC<ThemedTextProps> = ({ children, style, color = 'primary' }) => {
  const { theme } = useTheme();
  
  return (
    <Animated.Text style={[{ color: theme.colors[color] }, style]}>
      {children}
    </Animated.Text>
  );
};
