import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="screens/(tabs)"/>
      <Stack.Screen name="screens/Income"/>
      <Stack.Screen name="screens/LoginScreen"/>
      <Stack.Screen name="screens/Meetings"/>
      <Stack.Screen name="screens/Profile"/>
      <Stack.Screen name="screens/UnitSelection"/>
      <Stack.Screen name="screens/Workforce"/>
    </Stack>
  )
}
