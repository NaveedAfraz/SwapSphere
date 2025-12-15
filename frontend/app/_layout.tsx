import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { Provider } from "react-redux";
import { store } from "../src/store";
import { UserModeProvider } from "@/src/contexts/UserModeContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider as CustomThemeProvider } from "@/src/contexts/ThemeContext";
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <UserModeProvider>
        <SafeAreaProvider>
          <CustomThemeProvider>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
            </ThemeProvider>
          </CustomThemeProvider>
        </SafeAreaProvider>
      </UserModeProvider>
    </Provider>
  );
}
