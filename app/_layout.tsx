import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import React from 'react';
import { I18nManager, StyleSheet, Pressable, useColorScheme } from "react-native";
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageProvider from "../app/context/LanguageContext";
import { useLanguage } from "../app/context/LanguageContext";
import SmallTarazu from "../assets/images/small-tarazu.svg";
import UrduText from "./components/UrduText";
import i18n from './i18n';
import { useNavigationState } from '@react-navigation/native';


// Force RTL layout for the entire app
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

type HeaderProps = {
  navigation: any;
  route: {
    name: string;
    params?: {
      screen?: string;
      state?: any;
    };
  };
  options: any;
};

function CustomHeader({ navigation, route }: HeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const state = useNavigationState((state) => state);
  const currentRoute = state?.routes[state.index];

  // Helper function to recursively get nested routes
  const getFullPath = (state: any) => {
    const route = state.routes[state.index];
    let fullPath = route.name;

    if (route.state) {
      // If there's a nested navigator, recursively find the full path
      fullPath += '/' + getFullPath(route.state);
    }

    return fullPath;
  };

  const fullPath = state ? getFullPath(state) : 'No route';
  const { currentLanguage, changeLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Simplified navigation logic
  const isLoginScreen = route.name === "screens/LoginScreen";
  const isInTabs = route.name === "screens/(tabs)";

  const handleBack = () => {
    // When not in tabs, go back to Dashboard tab
    router.back()
  };

  // Only show back button on non-tab screens (except login)
  const showBackButton = !isInTabs && !isLoginScreen;

  return (
    <View style={[
      fullPath === 'screens/(tabs)/Arkan' ? styles.headerContainerSubscreen : styles.headerContainer,
      {
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <Pressable onPress={handleBack} style={styles.iconButton}>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </Pressable>
          ) : (
            <Pressable onPress={() => setMenuVisible(true)} style={styles.iconButton}>
              <Ionicons name="menu" size={24} color="white" />
            </Pressable>
          )}
        </View>

        <View style={styles.titleContainer}>
          {fullPath !== 'screens/(tabs)/Arkan' && <SmallTarazu style={{ width: 24, height: 24 }} />}
          <UrduText style={[styles.title, { color: "white" }]}>
            {fullPath === 'screens/(tabs)/Arkan' ? i18n.t('arkan') : i18n.t('e-tanzeem')}
          </UrduText>
        </View>

        <View style={styles.rightSection}>
          {!isLoginScreen && (
            <Pressable onPress={() => router.push('/screens/ProfileView')} style={styles.iconButton}>
              <Ionicons name="person-circle-outline" size={28} color="white" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          headerStyle: {
            backgroundColor: '#1E90FF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="screens/LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="screens/(tabs)" options={{ headerShown: true }} />
        <Stack.Screen name="screens/(stack)/ReportsScreen" options={{ headerShown: false }} />
        <Stack.Screen name="screens/Income" options={{ headerShown: true }} />
        <Stack.Screen name="screens/Meetings" options={{ headerShown: true }} />
        <Stack.Screen name="screens/ProfileView" options={{ headerShown: true }} />
        <Stack.Screen name="screens/UnitSelection" options={{ headerShown: true }} />
        <Stack.Screen name="screens/Workforce" options={{ headerShown: true }} />
        <Stack.Screen name="screens/RukunView" options={{ headerShown: true }} />
        <Stack.Screen name="screens/RukunAddEdit" options={{ headerShown: true }} />
        <Stack.Screen name="screens/ProfileEdit" options={{ headerShown: true }} />
      </Stack>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1E90FF'
  },
  headerContainerSubscreen: {
    backgroundColor: '#1E90FF',
    borderBottomWidth: 25,
    borderColor: '#1E90FF',
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
