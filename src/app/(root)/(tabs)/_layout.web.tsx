import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={typeof color === "string" ? color : "#687187"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calender"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={typeof color === "string" ? color : "#687187"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle-outline"
              size={size}
              color={typeof color === "string" ? color : "#687187"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={typeof color === "string" ? color : "#687187"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={typeof color === "string" ? color : "#687187"}
            />
          ),
        }}
      />
    </Tabs>
  );
}
