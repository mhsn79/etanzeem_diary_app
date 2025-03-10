import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import React from 'react';
import { I18nManager, StyleSheet, Pressable, useColorScheme } from "react-native";
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import type { DrawerContentComponentProps, DrawerNavigationOptions } from '@react-navigation/drawer';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageProvider from "../app/context/LanguageContext";
import { useLanguage } from "../app/context/LanguageContext";
import SmallTarazu from "../assets/images/small-tarazu.svg";
import UrduText from "./components/UrduText";
import i18n from './i18n';

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
  options: DrawerNavigationOptions;
};

function CustomHeader({ navigation, route }: HeaderProps) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Simplified navigation logic
  const isLoginScreen = route.name === "screens/LoginScreen";
  const isInTabs = route.name === "screens/(tabs)";
  
  const handleBack = () => {
    // When not in tabs, go back to Dashboard tab
    router.push('/screens/(tabs)/Dashboard');
  };

  // Only show back button on non-tab screens (except login)
  const showBackButton = !isInTabs && !isLoginScreen;

  return (
    <View style={[
      styles.headerContainer, 
      { 
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Pressable onPress={() => navigation.openDrawer()} style={styles.iconButton}>
            <Ionicons name="menu" size={24} color="white" />
          </Pressable>
        </View>
        
        <View style={styles.titleContainer}>
          <SmallTarazu style={{ width: 24, height: 24 }} />
          <UrduText style={[styles.title, { color: "white" }]}>
            {i18n.t('e-tanzeem')}
          </UrduText>
        </View>

        <View style={styles.rightSection}>
          {showBackButton && (
            <Pressable onPress={handleBack} style={styles.iconButton}>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function DrawerContent(props: DrawerContentComponentProps) {
  const { currentLanguage, changeLanguage } = useLanguage();
  const { state, navigation } = props;
  const isLoginScreen = state.routes[state.index].name === "screens/LoginScreen";
  const router = useRouter();

  const handleLanguageToggle = () => {
    changeLanguage(currentLanguage === 'en' ? 'ur' : 'en');
  };

  const handleLogout = () => {
    navigation.closeDrawer();
    setTimeout(() => {
      router.replace('/screens/LoginScreen');
    }, 100);
  };

  return (
    <View style={styles.drawer}>
      {!isLoginScreen && (
        <>
          <Pressable 
            style={styles.drawerItem} 
            onPress={() => {
              navigation.closeDrawer();
              router.replace('/');
            }}
          >
            <UrduText style={styles.drawerText}>
              {currentLanguage === 'ur' ? 'Home' : 'ہوم'}
            </UrduText>
          </Pressable>

          <Pressable 
            style={styles.drawerItem} 
            onPress={handleLanguageToggle}
          >
            <UrduText style={styles.drawerText}>
              {currentLanguage === 'ur' ? 'Change Language' : 'زبان تبدیل کریں'}
            </UrduText>
          </Pressable>

          <Pressable 
            style={styles.drawerItem} 
            onPress={handleLogout}
          >
            <UrduText style={styles.drawerText}>
              {currentLanguage === 'ur' ? 'Logout' : 'لاگ آؤٹ'}
            </UrduText>
          </Pressable>
        </>
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'JameelNooriNastaleeq': require('../assets/fonts/JameelNooriNastaleeq.ttf'),
  });

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          header: (props) => <CustomHeader {...props} />,
          drawerPosition: 'left',
          drawerStyle: {
            width: '70%',
          },
          drawerType: 'front',
        }}
      >
        <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Home' }} />
        <Drawer.Screen name="screens/Income" options={{ drawerLabel: 'Income' }} />
        <Drawer.Screen name="screens/LoginScreen" options={{ 
          drawerLabel: 'Login',
          headerShown: false,
          swipeEnabled: false,
        }} />
        <Drawer.Screen name="screens/Meetings" options={{ drawerLabel: 'Meetings' }} />
        <Drawer.Screen name="screens/Profile" options={{ drawerLabel: 'Profile' }} />
        <Drawer.Screen name="screens/UnitSelection" options={{ drawerLabel: 'Units' }} />
        <Drawer.Screen name="screens/Workforce" options={{ drawerLabel: 'Workforce' }} />
      </Drawer>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1E90FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
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
  drawer: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  drawerItem: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  drawerText: {
    fontSize: 18,
    textAlign: 'right',
    fontFamily: 'JameelNooriNastaleeq',
  },
});
