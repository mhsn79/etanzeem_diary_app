import directus from './directus';
import { Platform } from 'react-native';
import { getTokens, saveTokens } from './secureStorage';
import { getStore, ensureStoreInitialized } from '../store/storeAccess';
import { refreshOnce } from './refreshOrchestrator';

// Type for request options
interface RequestOptions {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

// Type for request function
type RequestFunction = () => RequestOptions;

const getAuthState = () => {
  ensureStoreInitialized();
  const state = getStore().getState() as { auth?: any };
  return state.auth || {};
};

// Queue for pending requests during token refresh
let requestQueue: Array<{
  resolve: () => void;
  reject: (error: Error) => void;
}> = [];
let refreshTimeoutLogoutTriggered = false;

// Maximum number of retry attempts for API requests
const MAX_REQUEST_RETRIES = 2;

// Exponential backoff for retry attempts
const getBackoffDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 seconds
};

const isTokenExpiredOrExpiring = (expiresAt?: number): boolean => {
  if (!expiresAt) return true;
  const fiveMinutesInMs = 5 * 60 * 1000;
  return Date.now() + fiveMinutesInMs >= expiresAt;
};

/**
 * Process all queued requests after token refresh
 */
const processQueue = (error: Error | null) => {
  requestQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  
  // Reset the queue
  requestQueue = [];
};

/**
 * Wait for token refresh to complete with timeout
 * This function checks if a refresh is in progress and waits for it to complete
 */
const waitForTokenRefresh = async (): Promise<void> => {
  ensureStoreInitialized();
  const state = getStore().getState() as { auth?: { isRefreshing?: boolean } };
  
  if (state.auth?.isRefreshing) {
    console.log(`[API] Token refresh in progress, waiting... (${Platform.OS})`);
    
    // Wait for refresh to complete with a timeout
    const timeout = 10000; // 10 seconds timeout
    const startTime = Date.now();
    
    while (getStore().getState().auth?.isRefreshing && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }
    
    if (getStore().getState().auth?.isRefreshing) {
      console.warn(`[API] Token refresh timeout after ${timeout}ms (${Platform.OS})`);
      if (!refreshTimeoutLogoutTriggered) {
        refreshTimeoutLogoutTriggered = true;
        try {
          const { logout } = require('../features/auth/authSlice');
          getStore().dispatch(logout());
        } finally {
          refreshTimeoutLogoutTriggered = false;
        }
      }
      throw new Error('Token refresh timeout');
    }
    
    console.log(`[API] Token refresh completed, proceeding with request (${Platform.OS})`);
  }
};

/**
 * Enhanced API client wrapper that uses the centralized auth middleware for token refresh
 * This function will:
 * 1. Check if a token refresh is in progress and wait for it to complete
 * 2. Make the API call with the current token
 * 3. If the API call fails with a 401, trigger a token refresh via the auth middleware and retry once
 * 4. Handle network errors with exponential backoff
 */
export const apiRequest = async <T>(requestFn: RequestFunction): Promise<T> => {
  // Get the current state
  const auth = getAuthState();
  let token = auth.tokens?.accessToken;

  // If no tokens, we can't make authenticated requests
  if (!token) {
    throw new Error('No authentication tokens available');
  }
  
  // If a token refresh is in progress, wait for it to complete
  await waitForTokenRefresh();
  
  // Get the latest token after potential refresh
  token = getStore().getState().auth?.tokens?.accessToken || token;
  
  const tryRequest = async (accessToken: string, retryCount = 0): Promise<T> => {
    try {
      // Get the request options
      const options = requestFn();
      
      // Add the authorization header if not already present
      const headers = options.headers || {};
      if (!headers['Authorization']) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Make the API call
      return await directus.request(() => ({
        ...options,
        headers
      })) as T;
    } catch (error: any) {
      // Check if the error is due to an expired token
      const isTokenError = 
        error?.response?.status === 401 || 
        error?.response?.status === 403 ||
        (error?.errors && error?.errors[0]?.message === 'Token expired.') ||
        error?.message?.includes('401') ||
        error?.message?.includes('403') ||
        error?.message?.includes('Token expired') ||
        error?.message?.includes('Invalid token');
      
      // Check if it's a network error
      const isNetworkError = 
        error?.message?.includes('Network') || 
        error?.message?.includes('timeout') || 
        error?.message?.includes('connection');
      
      // Handle token errors
      if (isTokenError && retryCount < MAX_REQUEST_RETRIES) {
        console.log(`[API] Token error during request (${retryCount + 1}/${MAX_REQUEST_RETRIES}). Refreshing... (${Platform.OS})`);
        
        try {
          // Let the auth middleware handle the token refresh
          // This will queue our request if a refresh is already in progress
          await refreshOnce('apiRequest 401');
          
          // Get the new token after refresh
          const newState = getStore().getState() as { auth?: any };
          const newToken = newState.auth?.tokens?.accessToken;
          
          if (!newToken) {
            throw new Error('Failed to refresh token: No new token received');
          }
          
          console.log(`[API] Token refreshed successfully. Retrying request... (${Platform.OS})`);
          
          // Retry the request with the new token
          return await tryRequest(newToken, retryCount + 1);
        } catch (refreshError: any) {
          console.error(`[API] Failed to refresh token: ${refreshError.message} (${Platform.OS})`);
          throw new Error('Authentication expired. Please log in again.');
        }
      }
      
      // Handle network errors with exponential backoff
      if (isNetworkError && retryCount < MAX_REQUEST_RETRIES) {
        const delay = getBackoffDelay(retryCount);
        console.log(`[API] Network error, retrying in ${delay}ms... (${Platform.OS})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return tryRequest(accessToken, retryCount + 1);
      }
      
      // If it's not a token issue or we've exhausted retries, rethrow the original error
      if (retryCount > 0) {
        console.error(`[API] Request failed after ${retryCount} retries: ${error.message} (${Platform.OS})`);
      } else {
        console.error(`[API] Request failed: ${error.message} (${Platform.OS})`);
      }
      
      throw error;
    }
  };
  
  // Try the request with the current token
  return await tryRequest(token);
};

/**
 * Direct API request using fetch (for cases where directus SDK doesn't work well)
 * Enhanced with the same token refresh mechanism as apiRequest
 */
export const directApiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<T> => {
  // Get the current state
  const auth = getAuthState();
  let token = auth.tokens?.accessToken;
  
  // If no tokens, we can't make authenticated requests
  if (!token) {
    throw new Error('No authentication tokens available');
  }
  
  // If a token refresh is in progress, wait for it to complete
  await waitForTokenRefresh();
  
  // Get the latest token after potential refresh
  token = getStore().getState().auth?.tokens?.accessToken || token;
  
  const tryFetch = async (accessToken: string, retryCount = 0): Promise<T> => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
      const url = `${baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      };
      
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error: any) {
      // Check if the error is a token expiration error
      const isTokenError = 
        error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('Token expired') ||
        error.message.includes('Invalid token');
      
      // Check if it's a network error
      const isNetworkError = 
        error.message.includes('Network') || 
        error.message.includes('timeout') || 
        error.message.includes('connection');
      
      // Handle token errors
      if (isTokenError && retryCount < MAX_REQUEST_RETRIES) {
        console.log(`[API] Token error during direct request (${retryCount + 1}/${MAX_REQUEST_RETRIES}). Refreshing... (${Platform.OS})`);
        
        try {
          // Let the auth middleware handle the token refresh
          await refreshOnce('directApiRequest 401');
          
          // Get the new token after refresh
          const newState = getStore().getState() as { auth?: any };
          const newToken = newState.auth?.tokens?.accessToken;
          
          if (!newToken) {
            throw new Error('Failed to refresh token: No new token received');
          }
          
          console.log(`[API] Token refreshed successfully. Retrying direct request... (${Platform.OS})`);
          
          // Retry the request with the new token
          return await tryFetch(newToken, retryCount + 1);
        } catch (refreshError: any) {
          console.error(`[API] Failed to refresh token: ${refreshError.message} (${Platform.OS})`);
          throw new Error('Authentication expired. Please log in again.');
        }
      }
      
      // Handle network errors with exponential backoff
      if (isNetworkError && retryCount < MAX_REQUEST_RETRIES) {
        const delay = getBackoffDelay(retryCount);
        console.log(`[API] Network error, retrying in ${delay}ms... (${Platform.OS})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return tryFetch(accessToken, retryCount + 1);
      }
      
      // If it's not a token issue or we've exhausted retries, rethrow the original error
      if (retryCount > 0) {
        console.error(`[API] Direct request failed after ${retryCount} retries: ${error.message} (${Platform.OS})`);
      } else {
        console.error(`[API] Direct request failed: ${error.message} (${Platform.OS})`);
      }
      
      throw error;
    }
  };
  
  // Try the request with the current token
  return await tryFetch(token);
};

/**
 * Export a helper function to manually refresh the token
 * This can be used in components that need to ensure a fresh token
 * before making multiple API calls
 */
export const ensureFreshToken = async (): Promise<string> => {
  try {
    await refreshOnce('ensureFreshToken');
    
    // Get the current state after potential refresh
    const auth = getAuthState();
    
    if (!auth.tokens?.accessToken) {
      throw new Error('No authentication token available');
    }
    
    return auth.tokens.accessToken;
  } catch (error: any) {
    console.error(`[API] Failed to ensure fresh token: ${error.message} (${Platform.OS})`);
    
    throw new Error('Authentication expired. Please log in again.');
  }
};

/**
 * Check if tokens are valid on app startup
 * This function should be called when the app starts to validate stored tokens
 */
export const validateTokensOnStartup = async (): Promise<void> => {
  try {
    // Get tokens from secure storage
    const tokens = await getTokens();
    
    // If no tokens, nothing to validate
    if (!tokens) {
      console.log(`[API] No tokens found in secure storage on startup (${Platform.OS})`);
      return;
    }
    
    // Check if tokens are expired
    if (isTokenExpiredOrExpiring(tokens.expiresAt)) {
      console.log(`[API] Tokens in secure storage are expired on startup, attempting refresh... (${Platform.OS})`);
      
      try {
        await refreshOnce('startup');
        console.log(`[API] Tokens refreshed successfully on startup (${Platform.OS})`);
      } catch (error: any) {
        console.error(`[API] Failed to refresh tokens on startup: ${error.message} (${Platform.OS})`);
      }
    } else {
      console.log(`[API] Tokens in secure storage are valid on startup (${Platform.OS})`);
    }
  } catch (error: any) {
    console.error(`[API] Error validating tokens on startup: ${error.message} (${Platform.OS})`);
  }
};

export default apiRequest;