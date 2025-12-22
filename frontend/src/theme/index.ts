export const theme = {
  colors: {
    // Primary colors
    primary: '#3B82F6',
    text: '#111827',
    textSecondary: '#6B7280',
    border: '#D1D5DB',
    
    // Background colors
    background: '#F9FAFB',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    backgroundSecondary: '#F3F4F6',
    
    // Status colors
    success: '#10B981',
    error: '#DC2626',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Additional semantic colors
    accent: '#3B82F6',
    secondary: '#6B7280',
    subtle: '#F3F4F6',
    
    // White
    white: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};

export type ThemeType = typeof theme;
