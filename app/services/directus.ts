import { createDirectus, rest, authentication, AuthenticationClient, AuthenticationData, AuthenticationStorage } from '@directus/sdk';
import { store } from '../store';
import { selectAccessToken, selectAuthState } from '../features/auth/authSlice';
import { getTokens, saveTokens } from './secureStorage';
import { Platform } from 'react-native';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';

// Create a custom storage implementation that gets tokens from SecureStore with Redux fallback
class SecureAuthStorage implements AuthenticationStorage {
  async get(): Promise<AuthenticationData | null> {
    try {
      // First try to get tokens from secure storage
      const tokens = await getTokens();
      
      if (tokens && tokens.accessToken) {
        return {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken || null,
          expires: tokens.expiresAt ? tokens.expiresAt - Date.now() : 900000,
          expires_at: tokens.expiresAt || (Date.now() + 900000)
        };
      }
      
      // Fallback to Redux if secure storage doesn't have tokens
      const state = store.getState();
      const auth = selectAuthState(state);
      const token = auth.tokens?.accessToken;
      
      if (!token) return null;
      
      // Save to secure storage for next time
      if (auth.tokens) {
        saveTokens(auth.tokens).catch(err => 
          console.error('Failed to save tokens to secure storage:', err)
        );
      }
      
      return {
        access_token: token,
        refresh_token: auth.tokens?.refreshToken || null,
        expires: auth.tokens?.expiresAt ? auth.tokens.expiresAt - Date.now() : 900000,
        expires_at: auth.tokens?.expiresAt || (Date.now() + 900000)
      };
    } catch (error) {
      console.error('Error in SecureAuthStorage.get():', error);
      return null;
    }
  }
  
  set(data: AuthenticationData | null): void {
    // We're not setting anything directly from here
    // Token management is handled by our middleware and auth slice
    console.log('Directus SDK tried to set token - this is handled by our auth system');
  }
}

// Create a singleton instance of the Directus client with enhanced configuration
const directus = createDirectus(API_BASE_URL)
  .with(authentication('json', {
    // Disable autoRefresh - we'll handle refresh in our middleware
    autoRefresh: false,
    storage: new SecureAuthStorage()
  }))
  .with(rest());

// Export a helper function to get the current token
export const getCurrentToken = async (): Promise<string | null> => {
  try {
    // First try to get from secure storage
    const tokens = await getTokens();
    if (tokens?.accessToken) {
      return tokens.accessToken;
    }
    
    // Fallback to Redux
    const state = store.getState();
    const token = selectAccessToken(state);
    return token ?? null; // Convert undefined to null
  } catch (error) {
    console.error('Error getting current token:', error);
    return null;
  }
};

// Export a helper function to get the current auth state
export const getAuthState = () => {
  return selectAuthState(store.getState());
};

export default directus;