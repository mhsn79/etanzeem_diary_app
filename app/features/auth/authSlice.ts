import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import directus from '../../services/directus';
import { clearActivities } from '../activities/activitySlice';
import { AppDispatch } from '../../store';

// Utility function to check if a token is expired or about to expire
// Returns true if token is expired or will expire in the next 5 minutes
export const isTokenExpiredOrExpiring = (expiresAt: number | undefined): boolean => {
  if (!expiresAt) return true;
  
  // Consider token expired if it expires in less than 5 minutes
  const fiveMinutesInMs = 5 * 60 * 1000;
  return Date.now() + fiveMinutesInMs >= expiresAt;
};

// Enhanced type definitions
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  last_access?: string;
  // Add any other fields that might be in the user data
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  tokens: null,
  user: null,
  status: 'idle',
  error: null,
};

// Enhanced login credentials type
export interface LoginCredentials {
  email: string;
  password: string;
}

// Enhanced auth response type
export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

// Enhanced login thunk with better error handling
export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { state: RootState; rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    // Authenticate with Directus
    const authResponse = await directus.login(credentials.email, credentials.password, {
      mode: 'json',
    });
    console.log('authResponse', authResponse);

    if (!authResponse.access_token || !authResponse.refresh_token) {
      return rejectWithValue('Invalid authentication response');
    }

    try {
      // Fetch user data with explicit authorization header
      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authResponse.access_token}`
        }
      }));      
      console.log('userData===============', JSON.stringify(userData));

      return {
        tokens: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: authResponse.expires ? Date.now() + authResponse.expires : Date.now() + 3600000, // 1 hour default
        },
        user: userData as User,
      };
    } catch (userDataError: any) {
      console.error('Failed to fetch user data:', userDataError);
      
      // If we can't fetch user data but have valid tokens, create a minimal user object
      return {
        tokens: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: authResponse.expires ? Date.now() + authResponse.expires : Date.now() + 3600000, // 1 hour default
        },
        user: {
          id: 'unknown',
          email: credentials.email,
        },
      };
    }
  } catch (error: any) {
    console.error('Login error:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Authentication failed';
    return rejectWithValue(errorMessage);
  }
});

// Enhanced refresh thunk with better error handling and fallback
export const refresh = createAsyncThunk<
  AuthResponse,
  void,
  { state: RootState; rejectValue: string }
>('auth/refresh', async (_, { getState, rejectWithValue }) => {
  console.log('Attempting to refresh token...');
  const state = getState();
  const refreshToken = state.auth.tokens?.refreshToken;

  if (!refreshToken) {
    console.error('No refresh token available');
    return rejectWithValue('No refresh token available');
  }

  try {
    // First try using the SDK
    try {
      console.log('Refreshing token using SDK...');
      const response = await directus.refresh();
      
      if (!response.access_token || !response.refresh_token) {
        throw new Error('Invalid refresh response from SDK');
      }

      console.log('Token refreshed successfully using SDK');
      
      // Get user data
      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${response.access_token}`
        }
      }));

      return {
        tokens: {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: response.expires ? Date.now() + response.expires : Date.now() + 3600000,
        },
        user: userData as User,
      };
    } catch (sdkError) {
      // If SDK refresh fails, try manual refresh
      console.log('SDK refresh failed, trying manual refresh...');
      
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          mode: 'json',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Manual refresh failed with status ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.data || !json.data.access_token || !json.data.refresh_token) {
        throw new Error('Invalid manual refresh response format');
      }
      
      console.log('Token refreshed successfully using manual refresh');
      
      // Get user data with new token
      const userResponse = await fetch(`${baseUrl}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${json.data.access_token}`,
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data after token refresh');
      }
      
      const userData = await userResponse.json();
      
      return {
        tokens: {
          accessToken: json.data.access_token,
          refreshToken: json.data.refresh_token,
          expiresAt: json.data.expires ? Date.now() + json.data.expires : Date.now() + 3600000,
        },
        user: userData.data as User,
      };
    }
  } catch (error: any) {
    console.error('Token refresh failed:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Token refresh failed';
    return rejectWithValue(errorMessage);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.tokens = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      directus.logout();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = 'succeeded';
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
        state.tokens = null;
        state.user = null;
      })
      .addCase(refresh.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(refresh.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = 'succeeded';
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(refresh.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Token refresh failed';
        state.tokens = null;
        state.user = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;

// Enhanced selectors with memoization
export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.tokens;
export const selectAccessToken = (state: RootState) => state.auth.tokens?.accessToken;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

// Thunk to check token expiration and refresh if needed
export const checkAndRefreshTokenIfNeeded = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>('auth/checkAndRefreshTokenIfNeeded', async (_, { getState, dispatch }) => {
  const state = getState();
  const tokens = state.auth.tokens;
  
  // If no tokens or user is not authenticated, do nothing
  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    return;
  }
  
  // Check if token is expired or about to expire
  if (isTokenExpiredOrExpiring(tokens.expiresAt)) {
    console.log('Token is expired or about to expire, refreshing...');
    await dispatch(refresh());
  }
});

export default authSlice.reducer;