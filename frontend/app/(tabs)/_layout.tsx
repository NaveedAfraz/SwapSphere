import React from "react";
import { Tabs } from "expo-router";
import CustomTabBar from "../../src/customTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        // we will provide our own tabBar renderer
        tabBarStyle: { display: "none" }, // hide default style
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {/* Keep the actual tab routes here (order matters) */}
      <Tabs.Screen name="search" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
