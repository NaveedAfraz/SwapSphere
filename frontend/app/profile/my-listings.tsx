import React from "react";
import { useUserMode } from "@/src/contexts/UserModeContext";
import MyListings from "@/src/features/profile/components/MyListings";
import MyIntents from "@/src/features/profile/components/MyIntents";

export default function MyListingsScreen() {
  const { isSellerMode } = useUserMode();

  // Show MyIntents when in customer mode, MyListings when in seller mode
  if (!isSellerMode) {
    return <MyIntents />;
  }

  return <MyListings />;
}
