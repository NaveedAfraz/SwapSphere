import React from "react";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import FAQSection from "@/src/features/support/components/FAQSection";

export default function SupportFAQScreen() {
  const insets = useSafeAreaInsets();

  return <FAQSection />;
}
