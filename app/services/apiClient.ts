import { store } from '../store';
import { 
  refresh, 
  selectAccessToken, 
  isTokenExpiredOrExpiring, 
  selectAuthState,
  checkAndRefreshTokenIfNeeded,
  logout
} from '../features/auth/authSlice';
import directus from './directus';
import { Platform } from 'react-native';

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

// Token refresh state to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process all queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  
  // Reset the queue
  refreshQueue = [];
};

/**
 * Centralized token refresh function that handles concurrency
 * Returns a promise that resolves with the new token
 */
const refreshTokenAndGetNew = async (): Promise<string> => {
  // If already refreshing, add to queue instead of making a new refresh call
  if (isRefreshing) {
    console.log('Token refresh already in progress, adding to queue', Platform.OS);
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }
  
  try {
    isRefreshing = true;
    console.log('Starting token refresh process', Platform.OS);
    
    // Store the refresh promise to reuse for concurrent requests
    refreshPromise = store.dispatch(refresh()).unwrap();
    const refreshResult = await refreshPromise;
    
    if (!refreshResult.tokens?.accessToken) {
      const error = new Error('Failed to refresh token: No new token received');
      processQueue(error);
      throw error;
    }
    
    console.log('Token refreshed successfully', Platform.OS);
    processQueue(null, refreshResult.tokens.accessToken);
    return refreshResult.tokens.accessToken;
  } catch (error: any) {
    console.error('Token refresh failed:', error, Platform.OS);
    
    // If refresh fails, we should log the user out
    store.dispatch(logout());
    
    const refreshError = new Error(error?.message || 'Authentication expired. Please log in again.');
    processQueue(refreshError);
    throw refreshError;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

/**
 * API client wrapper that handles token refreshing with improved concurrency handling
 * This function will:
 * 1. Check if the token is expired or about to expire
 * 2. If so, refresh the token using a centralized mechanism that prevents race conditions
 * 3. Make the API call with the fresh token
 * 4. If the API call fails with a 401, refresh the token and retry once
 */
export const apiRequest = async <T>(requestFn: RequestFunction): Promise<T> => {
  // Get the current state
  const state = store.getState();
  const auth = selectAuthState(state);
  let token = auth.tokens?.accessToken;

  // If no tokens, we can't make authenticated requests
  if (!token) {
    throw new Error('No authentication tokens available');
  }
  
  // Check if token is expired or about to expire
  if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
    console.log('Token is expired or about to expire, refreshing before request', Platform.OS);
    try {
      token = await refreshTokenAndGetNew();
    } catch (error) {
      console.error('Failed to refresh token before request:', error, Platform.OS);
      throw error;
    }
  }
  
  const tryRequest = async (accessToken: string): Promise<T> => {
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
  };
  
  try {
    // Try the request with the current token
    return await tryRequest(token);
  } catch (error: any) {
    // Check if the error is due to an expired token
    const isTokenError = 
      error?.response?.status === 401 || 
      (error?.errors && error?.errors[0]?.message === 'Token expired.');
    
    if (isTokenError) {
      console.log('Token expired during request. Attempting to refresh...', Platform.OS);
      
      try {
        // Try to refresh the token using our centralized mechanism
        const newToken = await refreshTokenAndGetNew();
        console.log('Token refreshed after 401. Retrying request...', Platform.OS);
        
        // Retry the request with the new token
        return await tryRequest(newToken);
      } catch (refreshError) {
        console.error('Failed to refresh token after 401:', refreshError, Platform.OS);
        throw new Error('Authentication expired. Please log in again.');
      }
    }
    
    // If it's not a token issue or refresh failed, rethrow the original error
    console.error('API request failed:', error, Platform.OS);
    throw error;
  }
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
  const state = store.getState();
  const auth = selectAuthState(state);
  let token = auth.tokens?.accessToken;
  
  // If no tokens, we can't make authenticated requests
  if (!token) {
    throw new Error('No authentication tokens available');
  }
  
  // Check if token is expired or about to expire
  if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
    console.log('Token is expired or about to expire, refreshing before direct request', Platform.OS);
    try {
      token = await refreshTokenAndGetNew();
    } catch (error) {
      console.error('Failed to refresh token before direct request:', error, Platform.OS);
      throw error;
    }
  }
  
  const tryFetch = async (accessToken: string): Promise<T> => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
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
  };
  
  try {
    // Try the request with the current token
    return await tryFetch(token);
  } catch (error: any) {
    // Check if the error is a token expiration error
    const isTokenError = 
      error.message.includes('401') || 
      error.message.includes('Token expired');
    
    if (isTokenError) {
      console.log('Token expired during direct request. Attempting to refresh...', Platform.OS);
      
      try {
        // Try to refresh the token using our centralized mechanism
        const newToken = await refreshTokenAndGetNew();
        console.log('Token refreshed after error. Retrying request...', Platform.OS);
        
        // Retry the request with the new token
        return await tryFetch(newToken);
      } catch (refreshError) {
        console.error('Failed to refresh token after error:', refreshError, Platform.OS);
        throw new Error('Authentication expired. Please log in again.');
      }
    }
    
    // If it's not a token issue or refresh failed, rethrow the original error
    console.error('Direct API request failed:', error, Platform.OS);
    throw error;
  }
};

/**
 * Export a helper function to manually refresh the token
 * This can be used in components that need to ensure a fresh token
 * before making multiple API calls
 */
export const ensureFreshToken = async (): Promise<string> => {
  const state = store.getState();
  const auth = selectAuthState(state);
  
  if (!auth.tokens?.accessToken) {
    throw new Error('No authentication token available');
  }
  
  if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
    return await refreshTokenAndGetNew();
  }
  
  return auth.tokens.accessToken;
};

export default apiRequest;