import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Platform } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === "dark" ? "#34C759" : "#007AFF",
        tabBarStyle: Platform.select({
          android: {
            height: 60,
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: colorScheme === "dark" ? "#1C1C1E" : "#E5E5EA",
            zIndex: 0,
          },
        }),
        tabBarHideOnKeyboard: Platform.OS === "ios",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Current Location",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="location-arrow" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculator"
        options={{
          title: "Calculator",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="calculator" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
