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
import { store } from "@/src/lib/store/index";
import { UserModeProvider } from "@/src/contexts/UserModeContext";
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <UserModeProvider>
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
      </UserModeProvider>
    </Provider>
  );
}
