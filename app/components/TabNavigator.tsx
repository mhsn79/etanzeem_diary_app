// TabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For tab icons
import Activities from '../screens/Activities';
import Arkan from '../screens/Arkan';
import Reports from '../screens/Reports';
import Dashboard from '../screens/Dashboard';
import i18n from '../i18n';
import UnitSelection from '../screens/UnitSelection';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
      <Tab.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false, // Hide header
          tabBarStyle: {
            backgroundColor: '#fff', // Background color for the tab bar
            borderTopWidth: 0, // Optional: Removes the border
            elevation: 0, // Optional: Removes shadow for Android
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={Dashboard}
          options={{
            tabBarLabel: i18n.t('dashboard'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Activities"
          component={Activities}
          options={{
            tabBarLabel: i18n.t('activities'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="timer" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Arkan"
          component={Arkan}
          options={{
            tabBarLabel: i18n.t('arkan'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Reports"
          component={Reports}
          options={{
            tabBarLabel: i18n.t('reports'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    // </NavigationContainer>
  );
}

export default TabNavigator;
