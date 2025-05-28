import { Tabs } from "expo-router";
import TabBar from "@/app/components/TabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Dashboard"
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="Reports"
        options={{
          tabBarLabel: "رپورٹس"
        }}
      />
      <Tabs.Screen
        name="Activities"
        options={{
          tabBarLabel: "سرگرمیاں",
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="Arkan"
        options={{
          tabBarLabel: "ارکان"
        }}
      />
      <Tabs.Screen
        name="Dashboard"
        options={{
          tabBarLabel: "ڈیش بورڈ"
        }}
      />
    </Tabs>
  );
}
