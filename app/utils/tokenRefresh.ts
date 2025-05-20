import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { selectAuthState, isTokenExpiredOrExpiring, checkAndRefreshTokenIfNeeded, logout } from '../features/auth/authSlice';
import { ensureFreshToken } from '../services/apiClient';
import { Platform } from 'react-native';

/**
 * Custom hook to ensure a fresh token before component mounts or when needed
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
        console.log('Token is expired or about to expire in useTokenRefresh hook, refreshing...', Platform.OS);
        await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token in useTokenRefresh hook:', error);
      dispatch(logout())
      return false;
    }
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
      console.error('Failed to ensure fresh token:', error);
      throw error;
    }
  }, []);
  
  return {
    refreshTokenIfNeeded,
    ensureFreshTokenBeforeOperation,
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
    console.error('Error in withTokenRefresh:', error);
    throw error;
  }
};