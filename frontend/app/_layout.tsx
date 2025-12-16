import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { Provider } from "react-redux";
import { store } from "../src/store";
import { UserModeProvider } from "@/src/contexts/UserModeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider as CustomThemeProvider, useTheme } from "@/src/contexts/ThemeContext";
import { AuthHydrationProvider } from "@/src/components/AuthHydrationProvider";
import { ThemedView } from "@/src/components/ThemedView";

// Component to handle navigation theme based on our custom theme
function NavigationThemeHandler({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  
  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthHydrationProvider>
        <UserModeProvider>
          <SafeAreaProvider>
            <CustomThemeProvider>
              <NavigationThemeHandler>
                <ThemedView style={{ flex: 1 }}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="(auth)"
                      options={{
                        headerShown: false,
                        presentation: "modal",
                      }}
                    />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemedView>
              </NavigationThemeHandler>
            </CustomThemeProvider>
          </SafeAreaProvider>
        </UserModeProvider>
      </AuthHydrationProvider>
    </Provider>
  );
}
