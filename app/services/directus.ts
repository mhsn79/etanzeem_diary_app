import { createDirectus, rest, authentication, AuthenticationClient, AuthenticationData, AuthenticationStorage } from '@directus/sdk';
import { store } from '../store';
import { selectAccessToken, selectAuthState } from '../features/auth/authSlice';

// Get the API base URL from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';

// Create a custom storage implementation that gets tokens from Redux
class ReduxStorage implements AuthenticationStorage {
  get(): AuthenticationData | null {
    const state = store.getState();
    const auth = selectAuthState(state);
    const token = auth.tokens?.accessToken;
    
    if (!token) return null;
    
    return {
      access_token: token,
      refresh_token: auth.tokens?.refreshToken || null,
      expires: auth.tokens?.expiresAt ? auth.tokens.expiresAt - Date.now() : 900000,
      expires_at: auth.tokens?.expiresAt || (Date.now() + 900000)
    };
  }
  
  set(data: AuthenticationData | null): void {
    // We're not setting anything in Redux from here
    // Token management is handled elsewhere in the app
    console.log('Directus SDK tried to set token - this is handled by Redux');
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

// Export a helper function to get the current auth state
export const getAuthState = () => {
  return selectAuthState(store.getState());
};

export default directus;