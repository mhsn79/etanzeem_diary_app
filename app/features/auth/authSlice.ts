import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { createDirectus, rest, authentication } from '@directus/sdk';

// Define the Directus client
const directus = createDirectus('http://139.59.232.231:8055')
  .with(authentication('json')) // Use JSON mode for token handling in React Native
  .with(rest());

// Define the User type based on Directus response
interface User {
  id: string;
  email: string;
}

// Define the AuthState
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
  status: 'idle',
  error: null,
};

// Define the payload for the login thunk
interface LoginCredentials {
  email: string;
  password: string;
}

// Define the response shape for login/refresh
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

// Login thunk using Directus SDK
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      // Authenticate with Directus
      const response = await directus.login(credentials.email, credentials.password, {
        mode: 'json',
      });
console.log('response', response);

      // Fetch the authenticated user's details (remove async from the request callback)
      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
      }));
console.log('userData', userData);

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: response.expires ? Date.now() + response.expires : null,
      } as AuthResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to login');
    }
  }
);

// Refresh thunk using Directus SDK
export const refresh = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      return rejectWithValue('No refresh token available');
    }

    try {
      // Refresh the token using Directus
      const response = await directus.refresh();

      // Fetch the authenticated user's details (remove async from the request callback)
      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
      }));

      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresAt: response.expires ? Date.now() + response.expires : null,
      } as AuthResponse;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh token');
    }
  }
);

// Define the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      directus.logout(); // Log out from Directus
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.expiresAt = action.payload.expiresAt;
        state.user = action.payload.user;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.user = null;
      })
      .addCase(refresh.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(refresh.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.expiresAt = action.payload.expiresAt;
        state.user = action.payload.user;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(refresh.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
        state.accessToken = null;
        state.refreshToken = null;
        state.expiresAt = null;
        state.user = null;
      });
  },
});

// Export actions and selectors
export const { logout, setError } = authSlice.actions;

export const selectIsAuthed = (state: RootState) => !!state.auth.accessToken;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

export default authSlice.reducer;