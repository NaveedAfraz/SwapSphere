// app/(tabs)/supportTab.tsx
import React from "react";
import { TouchableOpacity, View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { HeadphonesIcon } from "lucide-react-native";

export function SupportTabButton({ accessibilityState, onPress, ...rest }: any) {
  // accessibilityState.selected might be undefined because it's a fake tab
  const router = useRouter();
  const focused = !!accessibilityState?.selected;

  return (
    <TouchableOpacity
      accessible
      accessibilityRole="button"
      accessibilityLabel="Support"
      {...rest}
      // We intercept press and navigate to the real /support screen
      onPress={() => router.push("/support")}
      activeOpacity={0.85}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: focused ? "#EEF2FF" : "#FFFFFF",
        // keep it visually smaller than the main Home FAB so it doesn't collide
        transform: [{ translateY: Platform.OS === "ios" ? -10 : -6 }],
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        zIndex: 50,
      }}
    >
      <HeadphonesIcon
        size={22}
        color={focused ? "#111827" : "#6B7280"}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );
}
