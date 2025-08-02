import { Tabs } from "expo-router";
import TabBar from "@/app/components/TabBar";
import AuthGuard from "@/app/components/AuthGuard";

export default function TabLayout() {
  return (
    <AuthGuard requireAuth={true}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="Dashboard"
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen
          name="Dashboard"
          options={{
            tabBarLabel: "ڈیش بورڈ"
          }}
        />
        <Tabs.Screen
          name="Arkan"
          options={{
            tabBarLabel: "ارکان"
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
          name="Reports"
          options={{
            tabBarLabel: "رپورٹس"
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
