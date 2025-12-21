import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Interactions } from "@/src/constants/theme";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  GlobalThemeWrapper,
  ThemedText,
} from "@/src/components/GlobalThemeComponents";
import { isAuthenticated } from "@/src/services/authService";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const userIsAuthenticated = isAuthenticated();

  if (!userIsAuthenticated) {
    // Use custom fallback if provided, otherwise use default
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <GlobalThemeWrapper useFullPage={true}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.authPromptContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons 
              name="person-circle-outline" 
              size={80} 
              color={theme.colors.secondary} 
            />
            <ThemedText type="heading" style={styles.authPromptTitle}>
              Sign In Required
            </ThemedText>
            <ThemedText type="body" style={styles.authPromptMessage}>
              Please sign in to view your profile and access all features.
            </ThemedText>
            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: theme.colors.accent }]}
              onPress={() => router.replace("/(auth)/sign-in" as any)}
              activeOpacity={Interactions.buttonOpacity}
            >
              <ThemedText type="body" style={[styles.signInButtonText, { color: "#FFFFFF" }]}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </GlobalThemeWrapper>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  authPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  authPromptMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  signInButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AuthGuard;
