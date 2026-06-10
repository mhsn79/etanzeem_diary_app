import { Tabs } from "expo-router";
import TabBar from "@/src/components/TabBar";
import AuthGuard from "@/src/components/AuthGuard";

export default function TabLayout() {
  return (
    <AuthGuard requireAuth={true}>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
        initialRouteName="Dashboard"
        tabBar={(props) => <TabBar {...props} />}
        detachInactiveScreens={true}
      >
        <Tabs.Screen
          name="Dashboard"
          options={{
            tabBarLabel: "صفحہ اول"
          }}
        />
        <Tabs.Screen
          name="Arkan"
          options={{
            tabBarLabel: "افراد"
          }}
        />
        <Tabs.Screen
          name="Activities"
          options={{
            tabBarLabel: "سرگرمیاں",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Reports"
          options={{
            tabBarLabel: "رپورٹس",
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
