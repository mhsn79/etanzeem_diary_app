import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to splash screen first, which will handle navigation logic
  return <Redirect href="/splash" />;
}
