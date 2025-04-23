import { createDirectus, rest, authentication, AuthenticationClient, AuthenticationData, AuthenticationStorage } from '@directus/sdk';
import { store } from '../store';
import { selectAccessToken } from '../features/auth/authSlice';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL||'http://139.59.232.231:8055' ;

// Create a custom storage implementation that gets tokens from Redux
class ReduxStorage implements AuthenticationStorage {
  get(): AuthenticationData | null {
    const state = store.getState();
    const token = selectAccessToken(state);
    
    if (!token) return null;
    
    return {
      access_token: token,
      // We don't have refresh token and expires in this implementation
      // but we need to return a valid AuthData object
      refresh_token: null,
      expires: 900000, // Default 15 minutes in milliseconds
      expires_at: Date.now() + 900000 // 15 minutes from now
    };
  }
  
  set(data: AuthenticationData | null): void {
    // We're not setting anything in Redux from here
    // Token management is handled elsewhere in the app
    console.log('Directus SDK tried to set token:', data);
  }
}

// Create a singleton instance of the Directus client with enhanced configuration
const directus = createDirectus(API_BASE_URL)
  .with(authentication('json', {
    // Add a custom autoRefresh function that uses our Redux store
    autoRefresh: false, // We'll handle refresh manually
    storage: new ReduxStorage()
  }))
  .with(rest());

// Export a helper function to get the current token
export const getCurrentToken = (): string | null => {
  const state = store.getState();
  const token = selectAccessToken(state);
  return token ?? null; // Convert undefined to null
};

export default directus;