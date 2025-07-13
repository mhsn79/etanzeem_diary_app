import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import directus from '../../services/directus';
import { clearActivities } from '../activities/activitySlice';
import { AppDispatch } from '../../store';
import { fetchPersonByEmail } from '../persons/personSlice';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { persistor } from '../../store';
import { RESET_STATE } from '../../store/reducers';
import { saveTokens, clearTokens } from '../../services/secureStorage';
import { directApiRequest } from '../../services/apiClient';

// Helper function for making API requests during login when tokens are available but not in Redux store
const loginApiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  accessToken: string,
  body?: any
): Promise<T> => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
  const url = `${baseUrl}${endpoint}`;
  
  console.log(`[DEBUG] 🔗 Making login API request to: ${url}`);
  console.log(`[DEBUG] 🔑 Using token: ${accessToken.substring(0, 20)}...`);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'E-Tanzeem-App/1.0',
      'Accept': 'application/json'
    }
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  
  try {
    console.log(`[DEBUG] 📡 Sending request with options:`, {
      method: options.method,
      headers: options.headers,
      hasBody: !!options.body
    });
    
    const response = await fetch(url, options);
    
    console.log(`[DEBUG] 📥 Response status: ${response.status}`);
    console.log(`[DEBUG] 📥 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DEBUG] ❌ Request failed with status ${response.status}: ${errorText}`);
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log(`[DEBUG] ✅ Request successful, data keys:`, Object.keys(responseData));
    
    return responseData as T;
  } catch (error: any) {
    console.error(`[DEBUG] ❌ Network request failed for ${url}:`, error);
    
    // Check if it's a DNS resolution error
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error(`[DEBUG] ❌ DNS resolution failed for ${url}`);
      throw new Error('DNS resolution failed. Please check your internet connection and try again.');
    }
    
    // Check if it's a timeout error
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new Error('Request timeout - please check your internet connection');
    }
    
    // Check if it's a network error
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      throw new Error('Network connection failed - please check your internet connection');
    }
    
    // Re-throw the original error
    throw error;
  }
};

// Fallback authentication function that bypasses Directus SDK
const fallbackAuth = async (email: string, password: string) => {
  console.log('[DEBUG] 🔄 Trying fallback authentication...');
  
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
  const url = `${baseUrl}/auth/login`;
  
  console.log('[DEBUG] 🔗 Fallback auth URL:', url);
  console.log('[DEBUG] 📧 Email:', email);
  console.log('[DEBUG] 🔑 Password length:', password.length);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'E-Tanzeem-App/1.0'
      },
      body: JSON.stringify({
        email,
        password,
        mode: 'json'
      })
    });
    
    console.log('[DEBUG] 📥 Fallback response status:', response.status);
    console.log('[DEBUG] 📥 Fallback response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] ❌ Fallback auth failed with status:', response.status, errorText);
      throw new Error(errorText || `Authentication failed with status ${response.status}`);
    }
    
    const authData = await response.json();
    console.log('[DEBUG] ✅ Fallback authentication successful');
    console.log('[DEBUG] 📝 Auth data keys:', Object.keys(authData));
    
    return authData;
  } catch (error: any) {
    console.error('[DEBUG] ❌ Fallback auth network error:', error);
    console.error('[DEBUG] ❌ Error name:', error.name);
    console.error('[DEBUG] ❌ Error message:', error.message);
    console.error('[DEBUG] ❌ Error stack:', error.stack);
    throw error;
  }
};

// Alternative fallback authentication using FormData
const fallbackAuthFormData = async (email: string, password: string) => {
  console.log('[DEBUG] 🔄 Trying FormData fallback authentication...');
  
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
  const url = `${baseUrl}/auth/login`;
  
  console.log('[DEBUG] 🔗 FormData auth URL:', url);
  
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('mode', 'json');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'E-Tanzeem-App/1.0'
      },
      body: formData
    });
    
    console.log('[DEBUG] 📥 FormData response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] ❌ FormData auth failed with status:', response.status, errorText);
      throw new Error(errorText || `FormData authentication failed with status ${response.status}`);
    }
    
    const authData = await response.json();
    console.log('[DEBUG] ✅ FormData authentication successful');
    
    return authData;
  } catch (error: any) {
    console.error('[DEBUG] ❌ FormData auth network error:', error.message);
    throw error;
  }
};

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

// Extended user interface to include additional details from /users/me endpoint
export interface ExtendedUser {
  // Include all User properties
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  last_access?: string;
  
  // Override role and avatar with detailed objects
  role_name?: string; // To store the string role from User
  role?: {
    id: string;
    name: string;
    admin_access?: boolean;
    app_access?: boolean;
  };
  avatar_id?: string; // To store the string avatar from User
  avatar?: {
    id: string;
    storage: string;
    filename_disk: string;
    filename_download: string;
    title: string;
    type: string;
    url: string;
  };
  // Add any other fields that might be useful
}

export interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  userDetails: ExtendedUser | null; // Separate state for detailed user data
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isRefreshing: boolean;
}

const initialState: AuthState = {
  tokens: null,
  user: null,
  userDetails: null,
  status: 'idle',
  error: null,
  isRefreshing: false,
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
  personData?: any; // Person data fetched by Nazim_id in login thunk
}

// Login thunk
export const login = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue, dispatch }) => {
  try {
    console.log('[DEBUG] 🚀 NEW LOGIN LOGIC STARTED for:', credentials.email);
    console.log('[DEBUG] 🔄 Authenticating with Directus...');
    
    // Test basic network connectivity first
    console.log('[DEBUG] 🧪 Testing basic network connectivity...');
    try {
      const connectivityTest = await fetch('https://httpbin.org/get', {
        method: 'GET',
        headers: {
          'User-Agent': 'E-Tanzeem-App/1.0',
          'Accept': 'application/json'
        }
      });
      console.log('[DEBUG] ✅ Basic network connectivity test passed');
    } catch (connectivityError: any) {
      console.error('[DEBUG] ❌ Basic network connectivity test failed:', connectivityError.message);
      console.error('[DEBUG] ❌ Error name:', connectivityError.name);
      console.error('[DEBUG] ❌ Error stack:', connectivityError.stack);
      
      // Try alternative test with IP address
      try {
        console.log('[DEBUG] 🔄 Trying alternative network test with IP...');
        const altTest = await fetch('https://8.8.8.8', {
          method: 'GET',
          headers: {
            'User-Agent': 'E-Tanzeem-App/1.0'
          }
        });
        console.log('[DEBUG] ✅ Alternative network test passed');
      } catch (altError: any) {
        console.error('[DEBUG] ❌ Alternative network test also failed:', altError.message);
        // Don't fail the login, just log the error and continue
        console.log('[DEBUG] ⚠️ Network test failed, but continuing with login...');
      }
    }
    
    // Test connection to the specific API server
    console.log('[DEBUG] 🧪 Testing API server connectivity...');
    try {
      const apiTest = await fetch('https://admin.jiislamabad.org');
      console.log('[DEBUG] ✅ API server connectivity test passed, status:', apiTest.status);
    } catch (apiError: any) {
      console.error('[DEBUG] ❌ API server connectivity test failed:', apiError.message);
      // Continue anyway, as the issue might be specific to the auth endpoint
    }
    
    // Try Directus SDK first, then fallback to manual authentication
    let authResponse;
    try {
      // Authenticate with Directus SDK
      authResponse = await directus.login(credentials.email, credentials.password, {
        mode: 'json',
      });
      console.log('[DEBUG] ✅ Directus SDK authentication successful');
    } catch (sdkError: any) {
      console.error('[DEBUG] ❌ Directus SDK authentication failed:', sdkError.message);
      console.log('[DEBUG] 🔄 Trying fallback authentication...');
      
      // Try JSON fallback authentication
      try {
        authResponse = await fallbackAuth(credentials.email, credentials.password);
        console.log('[DEBUG] ✅ JSON fallback authentication successful');
      } catch (jsonError: any) {
        console.error('[DEBUG] ❌ JSON fallback authentication failed:', jsonError.message);
        
        // Try FormData fallback authentication
        try {
          authResponse = await fallbackAuthFormData(credentials.email, credentials.password);
          console.log('[DEBUG] ✅ FormData fallback authentication successful');
        } catch (formDataError: any) {
          console.error('[DEBUG] ❌ FormData fallback authentication also failed:', formDataError.message);
          throw sdkError; // Re-throw the original SDK error
        }
      }
    }

    console.log('[DEBUG] ✅ Directus authentication successful');
    console.log('[DEBUG] 📝 Auth response keys:', Object.keys(authResponse));
    console.log('[DEBUG] 🌐 API Base URL:', process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org');
    console.log('[DEBUG] 🔑 Access token received:', !!authResponse.access_token);
    console.log('[DEBUG] 🔑 Refresh token received:', !!authResponse.refresh_token);

    if (!authResponse.access_token || !authResponse.refresh_token) {
      console.log('[DEBUG] ❌ Invalid authentication response - missing tokens');
      return rejectWithValue('Invalid authentication response');
    }

    try {
      // Create auth result object with minimal user info
      // We'll fetch complete user details from Person collection later
      const authResult: AuthResponse = {
        tokens: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: authResponse.expires ? Date.now() + authResponse.expires : Date.now() + 3600000,
        },
        user: { id: 'pending', email: credentials.email },
      };

      // Save tokens to secure storage
      await saveTokens(authResult.tokens);

      // Test network connectivity first
      console.log('[DEBUG] 🧪 Testing network connectivity...');
      try {
        const testResponse = await fetch('https://httpbin.org/get', {
          method: 'GET'
        });
        console.log('[DEBUG] ✅ Network connectivity test passed');
      } catch (testError: any) {
        console.error('[DEBUG] ❌ Network connectivity test failed:', testError.message);
        // Continue anyway, as the issue might be specific to the API server
      }

      // Test direct connection to the API server
      console.log('[DEBUG] 🧪 Testing direct API server connection...');
      try {
        const apiTestResponse = await fetch('https://admin.jiislamabad.org', {
          method: 'GET'
        });
        console.log('[DEBUG] ✅ Direct API server connection test passed, status:', apiTestResponse.status);
      } catch (apiTestError: any) {
        console.error('[DEBUG] ❌ Direct API server connection test failed:', apiTestError.message);
      }

      // Fetch user details from Directus to get the user ID
      // Use login-specific API request since tokens aren't in Redux store yet
      let userData;
      try {
        userData = await loginApiRequest<{ data: any }>(
          '/users/me?fields=*,role.*,avatar.*',
          'GET',
          authResponse.access_token
        );
      } catch (userError: any) {
        console.error('[DEBUG] ❌ Primary user fetch failed:', userError.message);
        
        // Try fallback approach with different headers
        console.log('[DEBUG] 🔄 Trying fallback user fetch...');
        try {
          const fallbackResponse = await fetch('https://admin.jiislamabad.org/users/me?fields=*,role.*,avatar.*', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authResponse.access_token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback request failed with status ${fallbackResponse.status}`);
          }
          
          userData = await fallbackResponse.json();
          console.log('[DEBUG] ✅ Fallback user fetch succeeded');
        } catch (fallbackError: any) {
          console.error('[DEBUG] ❌ Fallback user fetch also failed:', fallbackError.message);
          throw userError; // Re-throw the original error
        }
      }
      const userId = userData.data.id;
      
      console.log('[DEBUG] User authenticated with ID:', userId);
      
      // Update the auth result with the actual user data
      authResult.user = {
        id: userId,
        email: userData.data.email,
        first_name: userData.data.first_name,
        last_name: userData.data.last_name,
        role: userData.data.role?.name,
        status: userData.data.status,
        last_access: userData.data.last_access,
        avatar: userData.data.avatar?.id
      } as User;

      // Now fetch Tanzeemi_Unit using the user ID
      try {
        const tanzeemiData = await loginApiRequest<{ data: any[] }>(
          `/items/Tanzeemi_Unit?filter[user_id][_eq]=${userId}&fields=*`,
          'GET',
          authResponse.access_token
        );
        
        console.log('[DEBUG] Tanzeemi_Unit data:', tanzeemiData);
        
        if (tanzeemiData.data && tanzeemiData.data.length > 0) {
          const tanzeemiUnit = tanzeemiData.data[0];
          const nazimId = tanzeemiUnit.Nazim_id;
          
          if (nazimId) {
            console.log('[DEBUG] Found Nazim_id:', nazimId);
            
            // Fetch Person record using Nazim_id
            try {
              const personData = await loginApiRequest<{ data: any }>(
                `/items/Person/${nazimId}?fields=*`,
                'GET',
                authResponse.access_token
              );
              
              console.log('[DEBUG] Person data found:', personData);
              
              // Store the person data in the auth state for later use
              // This is the correct person data fetched by Nazim_id
              authResult.personData = personData.data;
            } catch (personError: any) {
              console.log('[DEBUG] No Person record found for Nazim_id:', nazimId, personError.message);
            }
          } else {
            console.log('[DEBUG] No Nazim_id found in Tanzeemi_Unit');
          }
        } else {
          console.log('[DEBUG] No Tanzeemi_Unit found for user:', userId);
        }
      } catch (tanzeemiError: any) {
        console.log('[DEBUG] Failed to fetch Tanzeemi_Unit for user:', userId, tanzeemiError.message);
        // Continue with login even if Tanzeemi_Unit is not found
      }

      return authResult;
    } catch (error: any) {
      console.log('[DEBUG] 🔥 INNER CATCH BLOCK - Error in user/Tanzeemi_Unit/Person fetch:', error);
      // If we can't check person data but have tokens, return minimal user info
      const authResult: AuthResponse = {
        tokens: {
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          expiresAt: authResponse.expires ? Date.now() + authResponse.expires : Date.now() + 3600000,
        },
        user: { id: 'unknown', email: credentials.email },
      };
      
      // Save tokens to secure storage
      await saveTokens(authResult.tokens);
      
      return authResult;
    }
  } catch (error: any) {
    console.log('[DEBUG] 🔥 OUTER CATCH BLOCK - Error in Directus authentication:', error);
    const errorMessage = error?.response?.data?.message || error?.message || 'Authentication failed';
    console.log('[DEBUG] 🔥 Final error message:', errorMessage);
    return rejectWithValue(errorMessage);
  }
});

// Enhanced refresh token thunk with better error handling
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
    // First try using the Directus SDK
    try {
      console.log(`[Auth] Refreshing token using Directus SDK (${Platform.OS})`);
      const response = await directus.refresh();
      
      if (!response.access_token || !response.refresh_token) {
        throw new Error('Invalid refresh response from SDK');
      }

      // Get user data with the new token
      const userData = await directus.request(() => ({
        path: '/users/me',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${response.access_token}` },
      }));

      const authResult = {
        tokens: {
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt: response.expires ? Date.now() + response.expires : Date.now() + 3600000,
        },
        user: userData as User,
      };
      
      // Save tokens to secure storage
      await saveTokens(authResult.tokens);
      
      return authResult;
    } catch (sdkError: any) {
      console.log(`[Auth] SDK refresh failed, trying manual refresh (${Platform.OS}): ${sdkError.message}`);
      
      // If SDK refresh fails, try manual refresh using login-specific API request
      const refreshData = await loginApiRequest<{ data: { access_token: string; refresh_token: string; expires?: number } }>(
        '/auth/refresh',
        'POST',
        refreshToken, // Use refresh token for authentication
        { refresh_token: refreshToken, mode: 'json' }
      );

      if (!refreshData.data || !refreshData.data.access_token || !refreshData.data.refresh_token) {
        throw new Error('Invalid manual refresh response format');
      }

      // Get user data with the new token
      const userData = await loginApiRequest<{ data: any }>(
        '/users/me',
        'GET',
        refreshData.data.access_token
      );

      const authResult = {
        tokens: {
          accessToken: refreshData.data.access_token,
          refreshToken: refreshData.data.refresh_token,
          expiresAt: refreshData.data.expires ? Date.now() + refreshData.data.expires : Date.now() + 3600000,
        },
        user: userData.data as User,
      };
      
      // Save tokens to secure storage
      await saveTokens(authResult.tokens);
      
      return authResult;
    }
  } catch (error: any) {
    // Handle specific error conditions
    const errorMessage = error?.response?.data?.message || error?.message || 'Token refresh failed';
    
    // Check for critical auth failures
    if (
      errorMessage.includes('expired') || 
      errorMessage.includes('invalid') || 
      errorMessage.includes('revoked') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403')
    ) {
      // Clear tokens from secure storage for critical auth failures
      await clearTokens();
    }
    
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

    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://admin.jiislamabad.org';
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
      // Clear auth state
      state.tokens = null;
      state.user = null;
      state.userDetails = null;
      state.status = 'idle';
      state.error = null;
      state.isRefreshing = false;
      
      // Logout from Directus
      directus.logout();
      
      // The global state reset will be handled by the thunk
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setIsRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    }
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
        state.isRefreshing = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
        state.tokens = null;
        state.user = null;
        state.userDetails = null;
        state.isRefreshing = false;
      })
      .addCase(refresh.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.isRefreshing = true;
      })
      .addCase(refresh.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = 'succeeded';
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.error = null;
        state.isRefreshing = false;
      })
      .addCase(refresh.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Token refresh failed';
        state.tokens = null;
        state.user = null;
        state.userDetails = null;
        state.isRefreshing = false;
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
      })
      .addCase(fetchUserMe.pending, (state) => {
        // Don't set loading state to avoid UI flicker
        state.error = null;
      })
      .addCase(fetchUserMe.fulfilled, (state, action: PayloadAction<ExtendedUser>) => {
        state.status = 'succeeded';
        
        // Update basic user object
        state.user = {
          id: action.payload.id,
          email: action.payload.email,
          first_name: action.payload.first_name,
          last_name: action.payload.last_name,
          role: action.payload.role?.name || action.payload.role_name,
          status: action.payload.status,
          last_access: action.payload.last_access,
          avatar: action.payload.avatar?.id || action.payload.avatar_id
        };
        
        // Store the full detailed user data
        // Make sure to preserve role_name and avatar_id for consistency
        state.userDetails = {
          ...action.payload,
          role_name: action.payload.role?.name || action.payload.role_name,
          avatar_id: action.payload.avatar?.id || action.payload.avatar_id
        };
        
        state.error = null;
      })
      .addCase(fetchUserMe.rejected, (state, action) => {
        // Don't set failed state to avoid UI disruption
        state.error = action.payload || 'Failed to fetch user data';
      });
  },
});

export const { logout: logoutAction, clearError, setError, setIsRefreshing } = authSlice.actions;

/**
 * Enhanced complete logout thunk that:
 * 1. Clears the auth state
 * 2. Clears tokens from secure storage
 * 3. Clears all relevant state from all slices
 * 4. Resets all Redux slices to their initial state
 * 5. Purges the persisted Redux data
 * 6. Shows a toast notification to inform the user
 * 7. Navigates to the login screen
 */
export const logout = createAsyncThunk(
  'auth/logoutComplete',
  async (message: string | undefined = undefined, { dispatch }) => {
    try {
      console.log(`[Auth] Starting logout process (${Platform.OS})`);
      
      // First clear tokens from secure storage
      try {
        await clearTokens();
        console.log(`[Auth] Tokens cleared from secure storage (${Platform.OS})`);
      } catch (clearTokensError) {
        console.error(`[Auth] Error clearing tokens from secure storage: ${clearTokensError} (${Platform.OS})`);
      }
      
      // Dispatch the auth logout action to clear auth state and log out from Directus
      dispatch(logoutAction());
      
      // Clear state from all relevant slices
      try {
        // Clear persons state
        const { clearPersons, clearUserDetails } = await import('../persons/personSlice');
        dispatch(clearUserDetails());
        dispatch(clearPersons());
        
        // Clear activities state
        const { clearActivities } = await import('../activities/activitySlice');
        dispatch(clearActivities());
        
        // Clear QA state
        const { clearSubmissions } = await import('../qa/qaSlice');
        dispatch(clearSubmissions());
        
        // Clear reports state
        const { clearReports, clearSubmissions: clearReportSubmissions } = await import('../reports/reportsSlice_new');
        dispatch(clearReports());
        dispatch(clearReportSubmissions());
        
        console.log(`[Auth] All slice states cleared (${Platform.OS})`);
      } catch (clearStateError) {
        console.error(`[Auth] Error clearing slice states: ${clearStateError} (${Platform.OS})`);
      }
      
      // Then dispatch the reset action to reset all slices to their initial state
      dispatch({ type: RESET_STATE });
      console.log(`[Auth] Redux state reset (${Platform.OS})`);
      
      try {
        // Finally, purge the persisted Redux data
        await persistor.purge();
        console.log(`[Auth] Persisted data purged (${Platform.OS})`);
      } catch (purgeError) {
        // If purge fails, log the error but continue with logout
        console.error(`[Auth] Error purging persisted data: ${purgeError} (${Platform.OS})`);
      }
      
      // Set error message to show in our custom Toast component
      try {
        const logoutMessage = message || 'Session expired. Please log in again.';
        // We'll use our custom Toast component which reads from the auth.error state
        dispatch(authSlice.actions.setError(logoutMessage));
        
        // Clear the error after a delay to hide the toast
        setTimeout(() => {
          dispatch(authSlice.actions.clearError());
        }, 4000);
      } catch (toastError) {
        console.error(`[Auth] Error setting error message: ${toastError} (${Platform.OS})`);
      }
      
      console.log(`[Auth] Logout complete (${Platform.OS})`);
      
      return true;
    } catch (error) {
      console.error(`[Auth] Error during logout process: ${error} (${Platform.OS})`);
      
      // Even if there's an error, we should still try to reset the state
      try {
        dispatch({ type: RESET_STATE });
      } catch (resetError) {
        console.error(`[Auth] Failed to reset state during error recovery: ${resetError} (${Platform.OS})`);
      }
      
      return true; // Return true anyway to allow navigation to continue
    }
  }
);

// Selectors
export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.tokens;
export const selectAccessToken = (state: RootState) => state.auth.tokens?.accessToken;
export const selectUser = (state: RootState) => state.auth.user;
export const selectUserDetails = (state: RootState) => state.auth.userDetails;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsRefreshing = (state: RootState) => state.auth.isRefreshing;

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
    try {
      console.log('Token is expired or about to expire, refreshing in checkAndRefreshTokenIfNeeded');
      await dispatch(refresh()).unwrap();
      console.log('Token refreshed successfully in checkAndRefreshTokenIfNeeded');
    } catch (error) {
      console.error('Failed to refresh token in checkAndRefreshTokenIfNeeded:', error);
      // If refresh fails, we should log the user out completely
      await dispatch(logout()).unwrap();
      throw new Error('Authentication expired. Please log in again.');
    }
  }
});

/**
 * Thunk to initialize auth state on app startup
 * This will check for stored tokens, refresh if needed, and fetch user data
 */
export const initializeAuth = createAsyncThunk<
  boolean,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/initialize', async (_, { dispatch, rejectWithValue }) => {
  try {
    // First check if we need to refresh the token
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    
    // Then fetch the latest user data
    await dispatch(fetchUserMe()).unwrap();
    
    return true;
  } catch (error: any) {
    console.log('Auth initialization failed:', error);
    // Don't reject, just return false to indicate initialization failed
    // This allows the app to continue in an unauthenticated state
    return false;
  }
});

/**
 * Thunk to fetch the current user data from Directus
 */
export const fetchUserMe = createAsyncThunk<
  ExtendedUser,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/fetchUserMe', async (_, { getState, rejectWithValue, dispatch }) => {
  try {
    const state = getState();
    const accessToken = state.auth.tokens?.accessToken;
    
    if (!accessToken) {
      return rejectWithValue('No access token available');
    }
    
    // Check if token needs refresh
    if (isTokenExpiredOrExpiring(state.auth.tokens?.expiresAt)) {
      await dispatch(refresh()).unwrap();
    }
    
    // Get updated token after potential refresh
    const updatedState = getState();
    const updatedToken = updatedState.auth.tokens?.accessToken;
    
    if (!updatedToken) {
      return rejectWithValue('Failed to get valid token');
    }
    
    // Fetch user data from Directus with expanded fields
    // Use centralized API client for proper error handling and retry logic
    const userData = await directApiRequest<{ data: ExtendedUser }>(
      '/users/me?fields=*,role.*,avatar.*',
      'GET'
    );
    console.log('Fetched detailed user data:', userData.data);
    return userData.data as ExtendedUser;
  } catch (error: any) {
    console.error('Fetch user me error:', error);
    return rejectWithValue(error.message || 'Failed to fetch user data');
  }
});

// Add this interface to store the complete login result
export interface CompleteLoginResult {
  auth: AuthResponse;
  personData?: any; // Person data fetched by Nazim_id in login thunk
  extendedUserDetails: ExtendedUser;
}

/**
 * Combined thunk that handles login and fetches person data
 * This is useful for components that need to wait for both operations to complete
 */
export const loginAndFetchUserDetails = createAsyncThunk<
  CompleteLoginResult,
  LoginCredentials,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('auth/loginAndFetchUserDetails', async (credentials, { dispatch, rejectWithValue }) => {
  try {
    // First, perform the login which already follows the correct flow:
    // 1. Get logged-in user ID and email
    // 2. Get Tanzeemi_Unit from logged-in user_id
    // 3. Get Nazim_id from Tanzeemi_Unit
    // 4. Get Person by Nazim_id
    const authResult = await dispatch(login(credentials)).unwrap();
    
    // The login thunk already fetches the person data by Nazim_id
    // We just need to get the latest user data from Directus for extended details
    const extendedUserDetails = await dispatch(fetchUserMe()).unwrap();
    
    // The login thunk already fetched person data by Nazim_id (the correct way)
    // Use the personData that was already fetched in the login process
    let userDetails = authResult.personData || null;
    
    // If we don't have person data from the login process, try fallback
    if (!userDetails) {
      try {
        userDetails = await dispatch(fetchPersonByEmail(credentials.email)).unwrap();
        console.log('[DEBUG] Using fallback fetchPersonByEmail since no person data from login');
      } catch (error) {
        console.log('[DEBUG] Fallback fetchPersonByEmail failed, but login already fetched person data by Nazim_id');
        // The login thunk already fetched person data by Nazim_id, so we can continue
      }
    }
    
    return { 
      auth: authResult,
      userDetails,
      extendedUserDetails
    };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Login and fetch user details failed');
  }
});

// Alias for selectUser for better semantic meaning
export const selectCurrentUser = selectUser;

// Selector for user avatar details
export const selectUserAvatar = (state: RootState) => state.auth.userDetails?.avatar;

export default authSlice.reducer;

// Simple network test function for debugging
export const testNetworkConnectivity = async () => {
  console.log('[DEBUG] 🧪 Testing network connectivity...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };
  
  const tests = [
    { name: 'Google DNS (IP)', url: 'https://8.8.8.8', type: 'ip' },
    { name: 'Cloudflare DNS (IP)', url: 'https://1.1.1.1', type: 'ip' },
    { name: 'HTTPBin (DNS)', url: 'https://httpbin.org/get', type: 'dns' },
    { name: 'API Server (DNS)', url: 'https://admin.jiislamabad.org', type: 'dns' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`[DEBUG] 🔍 Testing ${test.name}...`);
      const startTime = Date.now();
      const response = await fetch(test.url, { 
        method: 'GET',
        headers: {
          'User-Agent': 'E-Tanzeem-App/1.0'
        }
      });
      const endTime = Date.now();
      
      const result = {
        name: test.name,
        type: test.type,
        status: response.status,
        responseTime: endTime - startTime,
        success: true,
        error: null
      };
      
      results.tests.push(result);
      console.log(`[DEBUG] ✅ ${test.name} test passed - Status: ${response.status} (${result.responseTime}ms)`);
    } catch (error: any) {
      const result = {
        name: test.name,
        type: test.type,
        status: null,
        responseTime: null,
        success: false,
        error: error.message
      };
      
      results.tests.push(result);
      console.error(`[DEBUG] ❌ ${test.name} test failed:`, error.message);
    }
  }
  
  // Analyze results
  const ipTests = results.tests.filter(t => t.type === 'ip');
  const dnsTests = results.tests.filter(t => t.type === 'dns');
  
  const ipSuccess = ipTests.filter(t => t.success).length;
  const dnsSuccess = dnsTests.filter(t => t.success).length;
  
  console.log(`[DEBUG] 📊 Network Test Summary:`);
  console.log(`[DEBUG] 📊 IP connectivity: ${ipSuccess}/${ipTests.length} successful`);
  console.log(`[DEBUG] 📊 DNS resolution: ${dnsSuccess}/${dnsTests.length} successful`);
  
  if (ipSuccess > 0 && dnsSuccess === 0) {
    console.log(`[DEBUG] ⚠️  DNS resolution issue detected - IP connectivity works but DNS fails`);
  } else if (ipSuccess === 0) {
    console.log(`[DEBUG] ❌ No network connectivity detected`);
  } else if (dnsSuccess === 0) {
    console.log(`[DEBUG] ⚠️  DNS resolution issue - try restarting emulator or check DNS settings`);
  } else {
    console.log(`[DEBUG] ✅ Network connectivity appears normal`);
  }
  
  return results;
};