import { Middleware, AnyAction } from 'redux';
import { isTokenExpiredOrExpiring, refresh, logout } from '../../features/auth/authSlice';
import { saveTokens, clearTokens } from '../../services/secureStorage';
import type { RootState } from '../index';
import { Platform } from 'react-native';
import { ThunkDispatch } from '@reduxjs/toolkit';

// Token refresh state to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;
let refreshQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

// Maximum number of retry attempts for token refresh
const MAX_REFRESH_RETRIES = 3;

// Debounce time for refresh attempts (in milliseconds)
const REFRESH_DEBOUNCE_TIME = 500;

// Last refresh attempt timestamp
let lastRefreshAttempt = 0;

/**
 * Process all queued actions after token refresh
 */
const processQueue = (error?: any) => {
  refreshQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  
  // Reset the queue
  refreshQueue = [];
};

/**
 * Exponential backoff for retry attempts
 * @param attempt Current attempt number (0-based)
 * @returns Delay in milliseconds
 */
const getBackoffDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
};

/**
 * Enhanced middleware to handle token refreshing with improved error handling and retry logic
 * This middleware will:
 * 1. Check if the token is expired or about to expire before any API call
 * 2. If so, refresh the token with retry logic and queue management
 * 3. Handle critical auth failures by logging out the user
 * 4. Implement exponential backoff for network failures
 * 5. Debounce refresh attempts to prevent excessive calls
 */
const authMiddleware = ((api) => {
  return (next) => {
    return (action) => {
      // Skip token check for auth-related actions to prevent infinite loops
      const actionObj = action as AnyAction;
      const isAuthAction = actionObj.type?.includes('auth/');
      const isPendingAction = actionObj.type?.endsWith('/pending');
      
      // Only check tokens for pending API actions that aren't auth-related
      if (isPendingAction && !isAuthAction) {
        const state = api.getState() as RootState;
        const { auth } = state;
        
        // Check if we have tokens and if they're expired or about to expire
        if (auth.tokens && isTokenExpiredOrExpiring(auth.tokens.expiresAt)) {
          console.log(`[Auth Middleware] Token expired or about to expire, refreshing... (${Platform.OS})`);
          
          // If a refresh is already in progress, wait for it to complete
          if (isRefreshing && refreshPromise) {
            console.log(`[Auth Middleware] Refresh already in progress, queueing action... (${Platform.OS})`);
            
            return new Promise((resolve, reject) => {
              refreshQueue.push({ resolve, reject });
            }).then(() => {
              // After refresh completes successfully, dispatch the original action
              return next(action);
            }).catch(error => {
              console.error(`[Auth Middleware] Error during token refresh: ${error} (${Platform.OS})`);
              
              // If refresh fails, log the user out
              const thunkDispatch = api.dispatch as ThunkDispatch<RootState, unknown, AnyAction>;
              thunkDispatch(logout('Your session has expired. Please log in again.'));
              
              throw error;
            });
          }
          
          // Debounce refresh attempts
          const now = Date.now();
          if (now - lastRefreshAttempt < REFRESH_DEBOUNCE_TIME) {
            console.log(`[Auth Middleware] Refresh attempt debounced (${Platform.OS})`);
            
            // Wait for the debounce period
            return new Promise(resolve => setTimeout(resolve, REFRESH_DEBOUNCE_TIME))
              .then(() => next(action));
          }
          
          lastRefreshAttempt = now;
          
          // Start a new refresh with retry logic
          isRefreshing = true;
          refreshPromise = (async () => {
            let attempt = 0;
            let lastError: any = null;
            
            while (attempt < MAX_REFRESH_RETRIES) {
              try {
                console.log(`[Auth Middleware] Starting token refresh (attempt ${attempt + 1}/${MAX_REFRESH_RETRIES})... (${Platform.OS})`);
                
                // Dispatch the refresh action
                const thunkDispatch = api.dispatch as ThunkDispatch<RootState, unknown, AnyAction>;
                const result = await thunkDispatch(refresh());
                
                console.log(`[Auth Middleware] Token refresh successful (${Platform.OS})`);
                
                // Process any queued actions
                processQueue();
                
                return result;
              } catch (error: any) {
                lastError = error;
                
                // Check if this is a network error (which we might retry) or a critical auth failure
                const isNetworkError = error.message?.includes('Network') || 
                                      error.message?.includes('timeout') || 
                                      error.message?.includes('connection');
                
                const isCriticalAuthFailure = error.message?.includes('expired') || 
                                             error.message?.includes('invalid') || 
                                             error.message?.includes('revoked') ||
                                             error.message?.includes('401') ||
                                             error.message?.includes('403');
                
                // If it's a critical auth failure, don't retry
                if (isCriticalAuthFailure) {
                  console.error(`[Auth Middleware] Critical auth failure: ${error.message} (${Platform.OS})`);
                  break;
                }
                
                // For network errors, retry with exponential backoff
                if (isNetworkError && attempt < MAX_REFRESH_RETRIES - 1) {
                  const delay = getBackoffDelay(attempt);
                  console.log(`[Auth Middleware] Network error, retrying in ${delay}ms... (${Platform.OS})`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  attempt++;
                } else {
                  console.error(`[Auth Middleware] Token refresh failed after ${attempt + 1} attempts: ${error.message} (${Platform.OS})`);
                  break;
                }
              }
            }
            
            // If we've exhausted all retries or hit a critical auth failure
            console.error(`[Auth Middleware] Token refresh failed: ${lastError?.message} (${Platform.OS})`);
            
            // Process queued actions with the error
            processQueue(lastError);
            
            // Log the user out
            const thunkDispatch = api.dispatch as ThunkDispatch<RootState, unknown, AnyAction>;
            thunkDispatch(logout('Your session has expired. Please log in again.'));
            
            throw lastError;
          })().finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
          
          // Wait for the refresh to complete, then dispatch the original action
          return refreshPromise
            .then(() => next(action))
            .catch(error => {
              console.error(`[Auth Middleware] Error after token refresh: ${error} (${Platform.OS})`);
              throw error;
            });
        }
      }
      
      // For all other actions, just pass them through
      return next(action);
    };
  };
}) as Middleware;

export default authMiddleware;