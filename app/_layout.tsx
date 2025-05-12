import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import React from 'react';
import { I18nManager, StyleSheet, Pressable, useColorScheme, TouchableOpacity, Platform } from "react-native";
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageProvider from "../app/context/LanguageContext";
import { useLanguage } from "../app/context/LanguageContext";
import SmallTarazu from "../assets/images/small-tarazu.svg";
import UrduText from "./components/UrduText";
import i18n from './i18n';
import { useNavigationState,getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { COLORS, SPACING } from "./constants/theme";
import { store, persistor } from '@/app/store';              // ← adjust paths if needed
import { usePushNotifications } from "@/src/hooks/usePushNotifications";


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
  title?: string;
};

function CustomHeader({ navigation, route, title }: HeaderProps) {
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

        </View>

        <View style={styles.titleContainer}>
          {title ? <UrduText style={[styles.title, { color: "white" }]}>{title}</UrduText> :
            <>
              {fullPath !== 'screens/(tabs)/Arkan' && <SmallTarazu style={{ width: 24, height: 24 }} />}
              <UrduText style={[styles.title, { color: "white" }]}>
                {fullPath === 'screens/(tabs)/Arkan' ? i18n.t('arkan') : i18n.t('e-tanzeem')}
              </UrduText>
            </>
          }
        </View>

        <View style={styles.rightSection}>


          {isInTabs && (
            <Pressable onPress={() => router.push('/screens/ProfileView')} style={styles.iconButton}>
              <Ionicons name="person-circle-outline" size={42} color={COLORS.orange} />
            </Pressable>
          )}
          {showBackButton && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const token = usePushNotifications();
  console.log('token',token);
  

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
        <Stack.Screen name="screens/(tabs)" 
         options={({ route }) => {
          // If no tab is focused yet, you’ll get undefined: default to TRUE.
          const focused = getFocusedRouteNameFromRoute(route);
          const hideForActivities = focused === "Activities";
          return { headerShown: !hideForActivities };
        }} />
        <Stack.Screen name="screens/(stack)" options={{ headerShown: false }} />
      </Stack>
    </LanguageProvider>
    </PersistGate>
    </Provider>
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
    // Use I18nManager.isRTL to determine layout direction based on app language
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
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
  backButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 7,
    position: 'absolute',
    left: SPACING.xs,
    bottom: -SPACING.md,
  },
});
