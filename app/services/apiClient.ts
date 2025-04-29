import { store } from '../store';
import { 
  refresh, 
  selectAccessToken, 
  isTokenExpiredOrExpiring, 
  selectAuthState,
  checkAndRefreshTokenIfNeeded
} from '../features/auth/authSlice';
import directus from './directus';

// Type for request options
interface RequestOptions {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, any>;
  body?: string;
  headers?: Record<string, string>;
}

// Type for request function
type RequestFunction = () => RequestOptions;

/**
 * API client wrapper that handles token refreshing
 * This function will:
 * 1. Check if the token is expired or about to expire
 * 2. If so, refresh the token
 * 3. Make the API call with the fresh token
 * 4. If the API call fails with a 401, refresh the token and retry once
 */
export const apiRequest = async <T>(requestFn: RequestFunction): Promise<T> => {
  // First, check and refresh token if needed
  await store.dispatch(checkAndRefreshTokenIfNeeded());
  
  // Get the current state
  const state = store.getState();
  const auth = selectAuthState(state);
  const token = auth.tokens?.accessToken;
  
  // If no tokens, we can't make authenticated requests
  if (!token) {
    throw new Error('No authentication tokens available');
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
    
    if (isTokenError && isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      console.log('Token expired during request. Attempting to refresh...');
      
      try {
        // Try to refresh the token
        const refreshResult = await store.dispatch(refresh()).unwrap();
        console.log('Token refreshed after 401. Retrying request...');
        
        if (!refreshResult.tokens?.accessToken) {
          throw new Error('Failed to refresh token');
        }
        
        // Retry the request with the new token
        return await tryRequest(refreshResult.tokens.accessToken);
      } catch (refreshError) {
        console.error('Failed to refresh token after 401:', refreshError);
        throw new Error('Authentication expired. Please log in again.');
      }
    }
    
    // If it's not a token issue or refresh failed, rethrow the original error
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Direct API request using fetch (for cases where directus SDK doesn't work well)
 */
export const directApiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<T> => {
  // First, check and refresh token if needed
  await store.dispatch(checkAndRefreshTokenIfNeeded());
  
  // Get the current state
  const state = store.getState();
  const auth = selectAuthState(state);
  const token = auth.tokens?.accessToken;
  
  // If no tokens, we can't make authenticated requests
  if (!token) {
    throw new Error('No authentication tokens available');
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
    
    if (isTokenError && isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      console.log('Token expired during direct request. Attempting to refresh...');
      
      try {
        // Try to refresh the token
        const refreshResult = await store.dispatch(refresh()).unwrap();
        console.log('Token refreshed after error. Retrying request...');
        
        if (!refreshResult.tokens?.accessToken) {
          throw new Error('Failed to refresh token');
        }
        
        // Retry the request with the new token
        return await tryFetch(refreshResult.tokens.accessToken);
      } catch (refreshError) {
        console.error('Failed to refresh token after error:', refreshError);
        throw new Error('Authentication expired. Please log in again.');
      }
    }
    
    // If it's not a token issue or refresh failed, rethrow the original error
    console.error('Direct API request failed:', error);
    throw error;
  }
};

export default apiRequest;