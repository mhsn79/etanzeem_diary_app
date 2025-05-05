import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import directus from '../../services/directus';
import { clearActivities } from '../activities/activitySlice';
import { AppDispatch } from '../../store';
import { fetchPersonByEmail } from '../persons/personSlice';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Utility function to check if a token is expired or about to expire
export const isTokenExpiredOrExpiring = (expiresAt: number | undefined): boolean => {
  if (!expiresAt) return true;
  const fiveMinutesInMs = 5 * 60 * 1000;
  return Date.now() + fiveMinutesInMs >= expiresAt;
};

// Type definitions
export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  last_access?: string;
  avatar?: string;
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

// Login thunk
export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue, dispatch }) => {
  try {
    const authResponse = await directus.login(credentials.email, credentials.password, {
      mode: 'json',
    });

    if (!authResponse.access_token || !authResponse.refresh_token) {
      return rejectWithValue('Invalid authentication response');
    }

    try {
      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authResponse.access_token}` },
      }));
      console.log('userData===================', userData);

      const authResult = {
        tokens: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: authResponse.expires ? Date.now() + authResponse.expires : Date.now() + 3600000,
        },
        user: userData as User,
      };

      // After successful login, fetch the person data by email
      // This is done asynchronously and doesn't block the login process
      if (credentials.email) {
        // Use the imported fetchPersonByEmail action
        dispatch(fetchPersonByEmail(credentials.email));
      }

      return authResult;
    } catch (userDataError: any) {
      return {
        tokens: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: authResponse.expires ? Date.now() + authResponse.expires : Date.now() + 3600000,
        },
        user: { id: 'unknown', email: credentials.email },
      };
    }
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Authentication failed';
    return rejectWithValue(errorMessage);
  }
});

// Refresh token thunk
export const refresh = createAsyncThunk<
  AuthResponse,
  void,
  { state: RootState; rejectValue: string }
>('auth/refresh', async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const refreshToken = state.auth.tokens?.refreshToken;

  if (!refreshToken) {
    return rejectWithValue('No refresh token available');
  }

  try {
    try {
      const response = await directus.refresh();
      if (!response.access_token || !response.refresh_token) {
        throw new Error('Invalid refresh response from SDK');
      }

      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${response.access_token}` },
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
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Manual refresh failed with status ${response.status}`);
      }

      const json = await response.json();
      if (!json.data || !json.data.access_token || !json.data.refresh_token) {
        throw new Error('Invalid manual refresh response format');
      }

      const userResponse = await fetch(`${baseUrl}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${json.data.access_token}` },
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
    const errorMessage = error?.response?.data?.message || error?.message || 'Token refresh failed';
    return rejectWithValue(errorMessage);
  }
});

// Interface for updateUserAvatar parameters
export interface UpdateUserAvatarParams {
  imageUri: string;
  onProgress?: (progress: number) => void;
}

// Optimized avatar update thunk
export const updateUserAvatar = createAsyncThunk<
  User,
  UpdateUserAvatarParams,
  { state: RootState; rejectValue: string }
>('auth/updateUserAvatar', async ({ imageUri, onProgress }, { getState, rejectWithValue, dispatch }) => {
  try {
    const state = getState();
    const accessToken = state.auth.tokens?.accessToken;
    const userId = state.auth.user?.id;

    if (!accessToken || !userId) {
      return rejectWithValue('User not authenticated');
    }

    // Check token expiration and refresh if needed
    if (isTokenExpiredOrExpiring(state.auth.tokens?.expiresAt)) {
      await dispatch(refresh()).unwrap();
      // Get updated token after refresh
      const updatedState = getState();
      if (!updatedState.auth.tokens?.accessToken) {
        return rejectWithValue('Failed to refresh token');
      }
    }

    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
    const filename = imageUri.split('/').pop() || `avatar_${Date.now()}.jpg`;

    // Use Directus SDK for file upload where possible
    let fileId: string;
    if (Platform.OS !== 'web') {
      // Native platforms: Use FileSystem for better progress tracking
      const uploadResult = await FileSystem.uploadAsync(
        `${baseUrl}/files`,
        imageUri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: 'image/jpeg',
          headers: { 'Authorization': `Bearer ${accessToken}` },
          parameters: { title: `User ${userId} avatar` },
        }
      );

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const responseData = JSON.parse(uploadResult.body);
      fileId = responseData.data.id;
    } else {
      // Web: Use fetch with FormData
      const formData = new FormData();
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, filename);

      const uploadResponse = await fetch(`${baseUrl}/files`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      fileId = uploadData.data.id;
    }

    if (!fileId) {
      throw new Error('Failed to obtain file ID');
    }

    // Update user with new avatar
    const updateResponse = await directus.request(() => ({
      path: `/users/${userId}`,
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ avatar: fileId }),
    }));

    // Fetch updated user data
    const userData = await directus.request(() => ({
      path: '/users/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }));

    return userData as User;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to update avatar';
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
      })
      .addCase(updateUserAvatar.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update avatar';
      });
  },
});

export const { logout, clearError } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.tokens;
export const selectAccessToken = (state: RootState) => state.auth.tokens?.accessToken;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;

export const checkAndRefreshTokenIfNeeded = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch }
>('auth/checkAndRefreshTokenIfNeeded', async (_, { getState, dispatch }) => {
  const state = getState();
  const tokens = state.auth.tokens;

  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    return;
  }

  if (isTokenExpiredOrExpiring(tokens.expiresAt)) {
    await dispatch(refresh());
  }
});

/**
 * Combined thunk that handles login and fetches person data
 * This is useful for components that need to wait for both operations to complete
 */
export const loginAndFetchUserDetails = createAsyncThunk<
  { auth: AuthResponse, userDetails: any },
  LoginCredentials,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/loginAndFetchUserDetails', async (credentials, { dispatch, rejectWithValue }) => {
  try {
    // First, perform the login
    const authResult = await dispatch(login(credentials)).unwrap();
    
    // Then fetch the person data
    const userDetails = await dispatch(fetchPersonByEmail(credentials.email)).unwrap();
    
    return { 
      auth: authResult,
      userDetails 
    };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Login and fetch user details failed');
  }
});

export default authSlice.reducer;