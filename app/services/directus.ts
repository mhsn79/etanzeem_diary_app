import { createDirectus, rest, authentication, AuthenticationClient, AuthenticationData, AuthenticationStorage } from '@directus/sdk';
import { getTokens, saveTokens } from './secureStorage';
import { Platform } from 'react-native';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';

// Create a custom storage implementation that gets tokens from SecureStore only
class SecureAuthStorage implements AuthenticationStorage {
  async get(): Promise<AuthenticationData | null> {
    try {
      // Get tokens from secure storage only
      const tokens = await getTokens();
      
      if (tokens && tokens.accessToken) {
        return {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken || null,
          expires: tokens.expiresAt ? tokens.expiresAt - Date.now() : 900000,
          expires_at: tokens.expiresAt || (Date.now() + 900000)
        };
      }
      
      return null;
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
    // Get from secure storage only
    const tokens = await getTokens();
    return tokens?.accessToken || null;
  } catch (error) {
    console.error('Error getting current token:', error);
    return null;
  }
};

// Export a helper function to get the current auth state
export const getAuthState = async () => {
  try {
    const tokens = await getTokens();
    return {
      tokens,
      status: tokens ? 'succeeded' : 'idle',
      error: null
    };
  } catch (error) {
    return {
      tokens: null,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default directus;