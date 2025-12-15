import React, { createContext, useContext, useState, ReactNode } from 'react';

// SwapSphere Theme - Premium Neutral Minimalist (Palette 2)
export const theme = {
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

interface ThemeContextType {
  theme: typeof theme;
  isDark: boolean;
  toggleTheme: () => void;
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

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
