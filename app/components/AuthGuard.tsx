import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { selectIsAuthenticated, selectAuthStatus, initializeAuth } from '../features/auth/authSlice';
import { router } from 'expo-router';
import { COLORS } from '../constants/theme';
import { useTokenRefresh } from '../utils/tokenRefresh';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authStatus = useAppSelector(selectAuthStatus);
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize automatic token refresh
  const { getTokenInfo } = useTokenRefresh();

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // If user is authenticated but we're on a screen that requires auth,
    // initialize auth to ensure we have fresh data
    if (isAuthenticated && requireAuth) {
      console.log('[AuthGuard] User is authenticated, initializing auth...');
      dispatch(initializeAuth());
    }
  }, [isAuthenticated, requireAuth, dispatch]);

  useEffect(() => {
    // Only attempt navigation after component is mounted
    if (!isMounted) return;

    // If authentication is required but user is not authenticated,
    // redirect to login screen
    if (requireAuth && !isAuthenticated && authStatus !== 'loading') {
      console.log('[AuthGuard] User not authenticated, redirecting to login...');
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        router.replace('/screens/LoginScreen');
      }, 100);
      return;
    }

    // If user is authenticated but we're on login screen, redirect to dashboard
    if (isAuthenticated && !requireAuth) {
      console.log('[AuthGuard] User is authenticated but on login screen, redirecting to dashboard...');
      // Use setTimeout to ensure navigation happens after render
      setTimeout(() => {
        router.replace('/screens/Dashboard');
      }, 100);
      return;
    }
  }, [isAuthenticated, requireAuth, authStatus, isMounted]);

  // Show loading indicator while checking authentication status
  if (authStatus === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If authentication is required but user is not authenticated, show loading
  // (navigation will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If user is authenticated but we're on login screen, show loading
  // (navigation will happen in useEffect)
  if (isAuthenticated && !requireAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Render children if authentication requirements are met
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
}); 