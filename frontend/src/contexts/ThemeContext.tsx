import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Animated, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createThemeClasses, ThemeClasses } from '@/src/styles/themeClasses';

// SwapSphere Theme - Premium Neutral Minimalist (Palette 2)
export const lightTheme = {
  colors: {
    // Primary Colors
    primary: '#111827', // Almost black (titles, primary text)
    accent: '#3B82F6', // Accent blue (buttons, active states, icons, CTAs)
    
    // Secondary Colors
    secondary: '#6B7280', // Muted neutral gray (secondary text, icons)
    border: '#D1D5DB', // Light gray (borders, chevron icons)
    
    // Background Colors
    background: '#F9FAFB', // Main background (light gray)
    surface: '#FFFFFF', // Pure white (cards, surfaces)
    subtle: '#F3F4F6', // Light gray (subtle borders, inactive states)
    
    // Status Colors
    success: '#10B981', // Green 500 (success, active status)
    error: '#DC2626', // Red 500 (error, destructive actions)
    warning: '#F59E0B', // Amber 500 (warning, pending status)
    
    // Additional Colors
    info: '#8B5CF6', // Purple (messages)
    pink: '#EC4899', // Pink (favorites)
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },
  
  typography: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

export const darkTheme = {
  ...lightTheme,
  colors: {
    // Primary Colors
    primary: '#F9FAFB', // Light text for dark mode
    accent: '#3B82F6', // Keep same accent blue
    
    // Secondary Colors
    secondary: '#D1D5DB', // Lighter gray for secondary text
    border: '#374151', // Darker borders
    
    // Background Colors
    background: '#111827', // Dark main background
    surface: '#1F2937', // Dark surface (cards, modals)
    subtle: '#374151', // Dark subtle backgrounds
    
    // Status Colors (keep same for consistency)
    success: '#10B981',
    error: '#DC2626',
    warning: '#F59E0B',
    
    // Additional Colors
    info: '#8B5CF6',
    pink: '#EC4899',
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  animatedValue: Animated.Value;
  isTransitioning: boolean;
  classes: ThemeClasses;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const animatedValue = useState(new Animated.Value(0))[0];

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only apply system theme if user hasn't explicitly set preference
      AsyncStorage.getItem('theme-preference').then((saved) => {
        if (!saved) {
          setTheme(colorScheme === 'dark');
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme-preference');
      if (savedTheme !== null) {
        setTheme(savedTheme === 'dark');
      } else {
        // Use system preference as default
        const colorScheme = Appearance.getColorScheme();
        setTheme(colorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (dark: boolean) => {
    try {
      await AsyncStorage.setItem('theme-preference', dark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = (dark: boolean) => {
    if (isDark === dark) return;
    
    setIsTransitioning(true);
    
    // Animate the transition
    Animated.timing(animatedValue, {
      toValue: dark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setIsDark(dark);
      saveThemePreference(dark);
      setIsTransitioning(false);
    });
  };

  const toggleTheme = () => {
    setTheme(!isDark);
  };

  // Interpolate colors for smooth transitions
  const interpolateColors = () => {
    const lightColors = lightTheme.colors;
    const darkColors = darkTheme.colors;
    
    return {
      ...lightTheme,
      colors: {
        primary: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.primary, darkColors.primary],
        }),
        accent: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.accent, darkColors.accent],
        }),
        secondary: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.secondary, darkColors.secondary],
        }),
        border: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.border, darkColors.border],
        }),
        background: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.background, darkColors.background],
        }),
        surface: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.surface, darkColors.surface],
        }),
        subtle: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.subtle, darkColors.subtle],
        }),
        success: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.success, darkColors.success],
        }),
        error: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.error, darkColors.error],
        }),
        warning: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.warning, darkColors.warning],
        }),
        info: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.info, darkColors.info],
        }),
        pink: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [lightColors.pink, darkColors.pink],
        }),
      },
    };
  };

  const currentTheme = isTransitioning ? interpolateColors() : (isDark ? darkTheme : lightTheme);
  const themeClasses = createThemeClasses(currentTheme);

  return (
    <ThemeContext.Provider value={{ 
      theme: currentTheme as typeof lightTheme, 
      isDark, 
      toggleTheme,
      setTheme,
      animatedValue,
      isTransitioning,
      classes: themeClasses
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
