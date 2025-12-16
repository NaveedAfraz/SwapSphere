import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';

// Global theme wrapper component that applies centralized theme classes
export const GlobalThemeWrapper: React.FC<{
  children: React.ReactNode;
  style?: any;
  useFullPage?: boolean;
}> = ({ children, style, useFullPage = true }) => {
  const { classes } = useTheme();
  
  return (
    <View style={[useFullPage ? classes.fullPage : classes.container, style]}>
      {children}
    </View>
  );
};

// Themed components that use centralized classes
export const ThemedText: React.FC<{
  children: React.ReactNode;
  style?: any;
  type?: 'heading' | 'subheading' | 'body' | 'caption' | 'text';
}> = ({ children, style, type = 'text' }) => {
  const { classes } = useTheme();
  
  const getTextClass = () => {
    switch (type) {
      case 'heading': return classes.heading;
      case 'subheading': return classes.subheading;
      case 'body': return classes.body;
      case 'caption': return classes.caption;
      default: return classes.text;
    }
  };
  
  return (
    <Text style={[getTextClass(), style]}>
      {children}
    </Text>
  );
};

export const ThemedCard: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { classes } = useTheme();
  
  return (
    <View style={[classes.card, style]}>
      {children}
    </View>
  );
};

export const ThemedButton: React.FC<{
  children: React.ReactNode;
  style?: any;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}> = ({ children, style, variant = 'primary', onPress }) => {
  const { classes } = useTheme();
  
  const getButtonClass = () => {
    switch (variant) {
      case 'primary': return classes.buttonPrimary;
      case 'secondary': return classes.buttonSecondary;
      default: return classes.button;
    }
  };
  
  return (
    <TouchableOpacity 
      style={[classes.button, getButtonClass(), style]} 
      onPress={onPress}
    >
      <ThemedText type="body">{children}</ThemedText>
    </TouchableOpacity>
  );
};

export const ThemedScrollView: React.FC<{
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
}> = ({ children, style, contentContainerStyle }) => {
  const { classes } = useTheme();
  
  return (
    <ScrollView 
      style={[classes.container, style]} 
      contentContainerStyle={contentContainerStyle}
    >
      {children}
    </ScrollView>
  );
};

// Layout components
export const ThemedRow: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { classes } = useTheme();
  
  return (
    <View style={[classes.row, style]}>
      {children}
    </View>
  );
};

export const ThemedColumn: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { classes } = useTheme();
  
  return (
    <View style={[classes.column, style]}>
      {children}
    </View>
  );
};

export const ThemedCenter: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { classes } = useTheme();
  
  return (
    <View style={[classes.center, style]}>
      {children}
    </View>
  );
};
