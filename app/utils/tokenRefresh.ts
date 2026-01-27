import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store/types';
import { selectAuthState, isTokenExpiredOrExpiring, checkAndRefreshTokenIfNeeded, logout } from '../features/auth/authSlice';
import { ensureFreshToken } from '../services/apiClient';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';

import { 
  setBackgroundRefreshTimer, 
  setLastRefreshTime, 
  getBackgroundRefreshTimer, 
  getLastRefreshTime, 
  stopBackgroundRefresh 
} from './authCleanup';

const REFRESH_COOLDOWN = 120000; // 2 minutes cooldown between refresh attempts
const BACKGROUND_CHECK_INTERVAL = 120000; // Check every 2 minutes
const TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // 2 minutes before expiry
const MAX_REFRESH_ATTEMPTS = 3; // Maximum refresh attempts before giving up

/**
 * Utility function to calculate time until token expires
 */
const getTimeUntilExpiry = (expiresAt: number): number => {
  return Math.max(0, expiresAt - Date.now());
};

/**
 * Utility function to determine if we should refresh the token
 */
const shouldRefreshToken = (expiresAt: number): boolean => {
  const timeUntilExpiry = getTimeUntilExpiry(expiresAt);
  const timeSinceLastRefresh = Date.now() - getLastRefreshTime();
  
  // Refresh if token expires within buffer time and we haven't refreshed recently
  return timeUntilExpiry <= TOKEN_EXPIRY_BUFFER && timeSinceLastRefresh >= REFRESH_COOLDOWN;
};

/**
 * Background token refresh function
 */
const performBackgroundRefresh = async (dispatch: AppDispatch, tokens: any) => {
  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    return;
  }

  // Check if we've exceeded max refresh attempts
  const lastRefreshTime = getLastRefreshTime();
  const timeSinceLastRefresh = Date.now() - lastRefreshTime;
  
  // If we've tried too many times recently, skip this refresh attempt
  if (timeSinceLastRefresh < REFRESH_COOLDOWN * MAX_REFRESH_ATTEMPTS) {
    console.log('[TokenRefresh] ⏭️ Skipping background refresh - too many recent attempts');
    return;
  }

  try {
    console.log('[TokenRefresh] 🔄 Performing background token refresh...');
    setLastRefreshTime(Date.now());
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    console.log('[TokenRefresh] ✅ Background token refresh successful');
  } catch (error) {
    console.error('[TokenRefresh] ❌ Background token refresh failed:', error);
    // Don't logout on background refresh failure, let the next API call handle it
    // Just log the error and continue - the user will be prompted to login on next API call
  }
};

/**
 * Start background token refresh timer
 */
const startBackgroundRefresh = (dispatch: AppDispatch, tokens: any) => {
  // Clear existing timer
  const currentTimer = getBackgroundRefreshTimer();
  if (currentTimer) {
    clearInterval(currentTimer);
  }

  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    return;
  }

  // Start periodic background refresh
  const newTimer = setInterval(() => {
    if (shouldRefreshToken(tokens.expiresAt)) {
      performBackgroundRefresh(dispatch, tokens);
    }
  }, BACKGROUND_CHECK_INTERVAL);
  
  // Also check immediately if token needs refresh
  if (shouldRefreshToken(tokens.expiresAt)) {
    performBackgroundRefresh(dispatch, tokens);
  }
  
  setBackgroundRefreshTimer(newTimer);
  console.log('[TokenRefresh] 🕐 Background refresh timer started');
};

/**
 * Enhanced custom hook to ensure a fresh token before component mounts or when needed
 * This is useful for screens that make multiple API calls and need to ensure
 * they have a valid token before starting
 */
export const useTokenRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector(selectAuthState);
  const appState = useRef(AppState.currentState);
  
  // Function to refresh token if needed
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!auth.tokens) return false;
    
    try {
      if (isTokenExpiredOrExpiring(auth.tokens.expiresAt)) {
        console.log('[TokenRefresh] Token is expired or about to expire, refreshing...', Platform.OS);
        setLastRefreshTime(Date.now());
        await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('[TokenRefresh] Failed to refresh token:', error);
      // Only logout if it's a critical auth error, otherwise let the next API call handle it
      const errorMessage = error?.message || '';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('401')) {
        await dispatch(logout('Authentication expired. Please log in again.')).unwrap();
      }
      return false;
    }
  }, [auth.tokens, dispatch]);
  
  // Handle app state changes for background refresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground, check if we need to refresh token
        if (auth.tokens && shouldRefreshToken(auth.tokens.expiresAt)) {
          console.log('[TokenRefresh] App came to foreground, refreshing token...');
          performBackgroundRefresh(dispatch, auth.tokens);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [auth.tokens, dispatch]);

  // Start/stop background refresh based on authentication state
  useEffect(() => {
    if (auth.tokens && auth.tokens.accessToken && auth.tokens.refreshToken) {
      startBackgroundRefresh(dispatch, auth.tokens);
    } else {
      stopBackgroundRefresh();
    }

    // Cleanup on unmount
    return () => {
      stopBackgroundRefresh();
    };
  }, [auth.tokens, dispatch]);
  
  // Refresh token on component mount if needed
  useEffect(() => {
    refreshTokenIfNeeded();
  }, [refreshTokenIfNeeded]);
  
  // Function to manually ensure a fresh token before critical operations
  const ensureFreshTokenBeforeOperation = useCallback(async () => {
    try {
      return await ensureFreshToken();
    } catch (error) {
      console.error('[TokenRefresh] Failed to ensure fresh token:', error);
      // The logout function will handle navigation to login screen
      await dispatch(logout('Authentication expired. Please log in again.')).unwrap();
      throw error;
    }
  }, [dispatch]);

  // Function to get token expiry information
  const getTokenInfo = useCallback(() => {
    if (!auth.tokens) {
      return {
        isExpired: true,
        timeUntilExpiry: 0,
        shouldRefresh: false
      };
    }

    const timeUntilExpiry = getTimeUntilExpiry(auth.tokens.expiresAt);
    const shouldRefresh = shouldRefreshToken(auth.tokens.expiresAt);

    return {
      isExpired: timeUntilExpiry <= 0,
      timeUntilExpiry,
      shouldRefresh
    };
  }, [auth.tokens]);
  
  return {
    refreshTokenIfNeeded,
    ensureFreshTokenBeforeOperation,
    getTokenInfo,
    isAuthenticated: !!auth.tokens?.accessToken,
    isTokenExpired: auth.tokens ? isTokenExpiredOrExpiring(auth.tokens.expiresAt) : true
  };
};

/**
 * Utility function to wrap API calls with token refresh
 * This is useful for one-off API calls that need to ensure they have a valid token
 */
export const withTokenRefresh = async <T>(
  apiCall: () => Promise<T>,
  dispatch: AppDispatch
): Promise<T> => {
  try {
    // First ensure we have a fresh token
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    
    // Then make the API call
    return await apiCall();
  } catch (error: any) {
    console.error('[TokenRefresh] Error in withTokenRefresh:', error);
    throw error;
  }
};

/**
 * Utility function to manually trigger background refresh
 * Useful for testing or manual refresh scenarios
 */
export const triggerBackgroundRefresh = async (dispatch: AppDispatch, tokens: any) => {
  await performBackgroundRefresh(dispatch, tokens);
};

/**
 * Utility function to get background refresh status
 */
export const getBackgroundRefreshStatus = () => {
  return {
    isActive: !!getBackgroundRefreshTimer(),
    lastRefreshTime: getLastRefreshTime(),
    timeSinceLastRefresh: Date.now() - getLastRefreshTime()
  };
};

/**
 * Cleanup function for background refresh
 * Call this when the app is shutting down or when you want to stop all background operations
 */
export const cleanupBackgroundRefresh = () => {
  stopBackgroundRefresh();
  setLastRefreshTime(0);
};

// Default export to prevent Expo Router from treating this as a route
export default {
  useTokenRefresh,
  withTokenRefresh,
  triggerBackgroundRefresh,
  getBackgroundRefreshStatus,
  cleanupBackgroundRefresh
};