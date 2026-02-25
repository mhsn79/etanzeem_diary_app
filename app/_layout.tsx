import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from "react";
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { I18nManager, StyleSheet, Pressable, useColorScheme, TouchableOpacity, Platform, ActivityIndicator, InteractionManager } from "react-native";
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
import { COLORS, SPACING } from "./constants/theme";
import { store, persistor } from '@/app/store';              // ← adjust paths if needed
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import AuthGuard from './components/AuthGuard';
import { useTokenRefresh } from './utils/tokenRefresh';
// import DebugPanel from './components/DebugPanel';

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

// Helper to get full path from navigation state (defined outside to avoid recreating)
function getFullPathFromState(state: any): string {
  if (!state?.routes?.[state.index]) return 'No route';
  const route = state.routes[state.index];
  let fullPath = route.name;
  if (route.state) fullPath += '/' + getFullPathFromState(route.state);
  return fullPath;
}

function CustomHeader({ navigation, route, title }: HeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  // Subscribe only to the path string to avoid re-renders from whole state reference changes
  const fullPath = useNavigationState((state) => (state ? getFullPathFromState(state) : 'No route'));
  const { currentLanguage, changeLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Simplified navigation logic
  const isLoginScreen = route.name === "screens/LoginScreen";
  const isInTabs = route.name === "screens/(tabs)";
  const isCreateReportScreen = fullPath?.includes?.('CreateReportScreen') ?? false;

  const handleBack = useCallback(() => {
    // Defer to avoid Fabric "Unable to find viewState for tag" when going back from stack screens
    InteractionManager.runAfterInteractions(() => {
      router.back();
    });
  }, [router]);

  // Defer profile navigation to break out of any synchronous update cycle (avoids "Maximum update depth exceeded")
  const handleProfilePress = useCallback(() => {
    setTimeout(() => router.push('/screens/ProfileView'), 0);
  }, [router]);

  // Only show back button on non-tab screens (except login). Hide on CreateReportScreen so its own header handles back (avoids accidental root back when opening report from tabs).
  const showBackButton = !isInTabs && !isLoginScreen && !isCreateReportScreen;

  // Collapse header for Activities tab (it has its own ScreenWrapper header).
  // IMPORTANT: we keep the view tree identical (no conditional mount/unmount)
  // and only change styles — this prevents the Fabric "Unable to find viewState"
  // crash that occurs when headerShown toggles and native views are created/destroyed
  // during tab transitions.
  const isActivitiesTab = fullPath?.includes?.('Activities') ?? false;

  return (
    <View style={[
      fullPath === 'screens/(tabs)/Arkan' ? styles.headerContainerSubscreen : styles.headerContainer,
      {
        paddingTop: insets.top,
      },
      isActivitiesTab && styles.headerCollapsed,
    ]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>

        </View>

        <View style={styles.titleContainer}>
          {title ? <UrduText style={[styles.title, { color: "white" }]}>{title}</UrduText> :
            <>
              {fullPath !== 'screens/(tabs)/Arkan' && <SmallTarazu style={{ width: 24, height: 24 }} />}
              <UrduText style={[styles.title, { color: "white" }]}>
                {fullPath === 'screens/(tabs)/Arkan' ? i18n.t('contacts') : i18n.t('e-tanzeem')}
              </UrduText>
            </>
          }
        </View>

        <View style={styles.rightSection}>


          {isInTabs && (
            <Pressable onPress={handleProfilePress} style={styles.iconButton}>
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
  
  // Debug panel state (only in development)
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const [fontsLoaded] = useFonts({
    JameelNooriNastaleeq: require('../assets/fonts/JameelNooriNastaleeq.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LanguageProvider>
          <AppContent 
            showDebugPanel={showDebugPanel}
            setShowDebugPanel={setShowDebugPanel}
          />
        </LanguageProvider>
      </PersistGate>
    </Provider>
  );
}

// Separate component to use Redux hooks after Provider is available
function AppContent({ 
  showDebugPanel, 
  setShowDebugPanel 
}: { 
  showDebugPanel: boolean; 
  setShowDebugPanel: (show: boolean) => void; 
}) {
  // Initialize automatic token refresh (now inside Provider)
  useTokenRefresh();
  
  return (
    <>
      {/* Debug Panel (only in development) */}
      {/* {__DEV__ && (
        <DebugPanel 
          isVisible={showDebugPanel} 
          onToggle={() => setShowDebugPanel(!showDebugPanel)} 
        />
      )} */}
      
      {/* Debug Toggle Button (only in development) */}
      {/* {__DEV__ && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            right: 10,
            width: 40,
            height: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
          onPress={() => setShowDebugPanel(!showDebugPanel)}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>🐛</Text>
        </TouchableOpacity>
      )} */}
      
      <Stack
          screenOptions={{
            header: (props) => <CustomHeader {...props} />,
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          <Stack.Screen name="splash" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="screens/LoginScreen" options={{ headerShown: false }} />
          <Stack.Screen name="screens/(tabs)" options={{ headerShown: true }} />
          <Stack.Screen name="screens/(stack)" options={{ headerShown: false }} />
        </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  fontLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    backgroundColor: COLORS.primary,
  },
  headerCollapsed: {
    height: 0,
    overflow: 'hidden',
    paddingTop: 0,
  },
  headerContainerSubscreen: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 25,
    borderColor: COLORS.primary,
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
    height: 53
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
