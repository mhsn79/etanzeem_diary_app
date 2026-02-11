import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store/types';
import { selectAuthState, isTokenExpiredOrExpiring, checkAndRefreshTokenIfNeeded, logout } from '../features/auth/authSlice';
import { ensureFreshToken } from '../services/apiClient';
import { Platform } from 'react-native';

/**
 * Enhanced custom hook to ensure a fresh token before component mounts or when needed
 * This is useful for screens that make multiple API calls and need to ensure
 * they have a valid token before starting
 */
export const useTokenRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector(selectAuthState);
  
  // Function to refresh token if needed
  const refreshTokenIfNeeded = useCallback(async () => {
    if (!auth.tokens) return false;
    
    try {
      if (isTokenExpiredOrExpiring(auth.tokens.expiresAt)) {
        console.log('[TokenRefresh] Token is expired or about to expire, refreshing...', Platform.OS);
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

    return {
      isExpired: isTokenExpiredOrExpiring(auth.tokens.expiresAt),
      timeUntilExpiry: Math.max(0, auth.tokens.expiresAt - Date.now()),
      shouldRefresh: isTokenExpiredOrExpiring(auth.tokens.expiresAt)
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

// Default export to prevent Expo Router from treating this as a route
export default {
  useTokenRefresh,
  withTokenRefresh
};