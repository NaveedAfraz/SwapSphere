import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  dark: "#111827",
  accent: "#3B82F6",
  white: "#FFFFFF",
};

export default function InboxLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "700",
          color: COLORS.dark,
        },
        headerTintColor: COLORS.accent,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: "#F9FAFB",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Inbox",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              style={{ marginLeft: 16 }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.dark}
              />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
