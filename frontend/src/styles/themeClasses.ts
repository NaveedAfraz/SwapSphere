import { StyleSheet } from 'react-native';

export interface ThemeClasses {
  // Full page classes
  fullPage: any;
  page: any;
  
  // Container classes
  container: any;
  screen: any;
  card: any;
  surface: any;
  
  // Text classes
  text: any;
  heading: any;
  subheading: any;
  body: any;
  caption: any;
  
  // Button classes
  button: any;
  buttonPrimary: any;
  buttonSecondary: any;
  
  // Input classes
  input: any;
  inputContainer: any;
  
  // Layout classes
  row: any;
  column: any;
  center: any;
  
  // Status classes
  success: any;
  error: any;
  warning: any;
  info: any;
}

export const createThemeClasses = (theme: any): ThemeClasses => {
  return StyleSheet.create({
    // Full page classes
    fullPage: {
      flex: 1,
      backgroundColor: theme.colors.background,
      minHeight: '100%',
    },
    page: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    
    // Container classes
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius?.medium || 8,
      padding: theme.spacing?.medium || 16,
      shadowColor: theme.shadows?.medium?.shadowColor || '#000',
      shadowOffset: theme.shadows?.medium?.shadowOffset || { width: 0, height: 2 },
      shadowOpacity: theme.shadows?.medium?.shadowOpacity || 0.1,
      shadowRadius: theme.shadows?.medium?.shadowRadius || 4,
      elevation: theme.shadows?.medium?.elevation || 3,
    },
    surface: {
      backgroundColor: theme.colors.surface,
    },
    
    // Text classes
    text: {
      color: theme.colors.secondary,
      fontSize: theme.typography?.body?.fontSize || 16,
      fontFamily: theme.typography?.body?.fontFamily || 'System',
    },
    heading: {
      color: theme.colors.primary,
      fontSize: theme.typography?.h1?.fontSize || 24,
      fontFamily: theme.typography?.h1?.fontFamily || 'System',
      fontWeight: theme.typography?.h1?.fontWeight || '700',
    },
    subheading: {
      color: theme.colors.primary,
      fontSize: theme.typography?.h2?.fontSize || 20,
      fontFamily: theme.typography?.h2?.fontFamily || 'System',
      fontWeight: theme.typography?.h2?.fontWeight || '600',
    },
    body: {
      color: theme.colors.secondary,
      fontSize: theme.typography?.body?.fontSize || 16,
      fontFamily: theme.typography?.body?.fontFamily || 'System',
      lineHeight: theme.typography?.body?.lineHeight || 24,
    },
    caption: {
      color: theme.colors.secondary,
      fontSize: theme.typography?.caption?.fontSize || 12,
      fontFamily: theme.typography?.caption?.fontFamily || 'System',
    },
    
    // Button classes
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius?.medium || 8,
      paddingVertical: theme.spacing?.small || 8,
      paddingHorizontal: theme.spacing?.medium || 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    
    // Input classes
    input: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius?.small || 4,
      padding: theme.spacing?.small || 8,
    },
    inputContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius?.small || 4,
      marginBottom: theme.spacing?.small || 8,
    },
    
    // Layout classes
    row: {
      flexDirection: 'row',
    },
    column: {
      flexDirection: 'column',
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    // Status classes
    success: {
      color: theme.colors.success,
    },
    error: {
      color: theme.colors.error,
    },
    warning: {
      color: theme.colors.warning,
    },
    info: {
      color: theme.colors.info,
    },
  }) as ThemeClasses;
};
