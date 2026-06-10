import { useEffect } from 'react';
import { useAppSelector } from '../../src/hooks/useAppSelector';
import { useAppDispatch } from '../../src/hooks/useAppDispatch';
import { selectAuthError, clearError } from '../features/auth/authSlice';
import { router } from 'expo-router';

/**
 * Custom hook to handle authentication errors and automatically redirect to login
 * This hook should be used in screens that make API calls that might fail due to authentication issues
 */
export const useAuthErrorHandler = () => {
  const dispatch = useAppDispatch();
  const authError = useAppSelector(selectAuthError);

  useEffect(() => {
    if (authError) {
      console.log('[useAuthErrorHandler] Auth error detected:', authError);
      
      // Check if the error is related to authentication
      const isAuthError = 
        authError.includes('Authentication expired') ||
        authError.includes('401') ||
        authError.includes('403') ||
        authError.includes('Token expired') ||
        authError.includes('Invalid token') ||
        authError.includes('Session expired');
      
      if (isAuthError) {
        console.log('[useAuthErrorHandler] Authentication error detected, redirecting to login...');
        
        // Clear the error to prevent multiple redirects
        dispatch(clearError());
        
        // Navigate to login screen with a delay to ensure safe navigation
        setTimeout(() => {
          router.replace('/screens/LoginScreen');
        }, 100);
      }
    }
  }, [authError, dispatch]);

  return {
    authError,
    clearAuthError: () => dispatch(clearError())
  };
}; 
// Default export to prevent Expo Router from treating this as a route
export default {
  useAuthErrorHandler
};