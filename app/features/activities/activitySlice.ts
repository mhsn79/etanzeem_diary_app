import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  isTokenExpiredOrExpiring,
  refresh,
  checkAndRefreshTokenIfNeeded,
  logout,
} from '../auth/authSlice';
import { Activity } from '@/src/types/Activity';
import { API_BASE_URL } from '@/app/constants/api';
import { Platform } from 'react-native';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────*/
const activitiesAdapter = createEntityAdapter<Activity>({
  selectId: activity => activity.id,
  sortComparer: (a, b) =>
    new Date(b.activity_date_and_time).getTime() -
    new Date(a.activity_date_and_time).getTime(),
});

interface ActivitiesExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createError: string | null;
}

export type ActivitiesState = ReturnType<typeof activitiesAdapter.getInitialState<ActivitiesExtraState>>;

const initialState: ActivitiesState = activitiesAdapter.getInitialState<ActivitiesExtraState>({
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Helper function for API requests
 * ────────────────────────────────────────────────────────────────────────────────*/
const apiRequest = async <T>(url: string, method: string, token: string, body?: any): Promise<T> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  // Ensure URL is properly formatted
  const requestUrl = `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  console.log(`Making ${method} request to: ${requestUrl}`, Platform.OS);
  
  const response = await fetch(requestUrl, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', errorText, Platform.OS);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Helper function for token refresh with improved error handling
 * ────────────────────────────────────────────────────────────────────────────────*/
const executeWithTokenRefresh = async <T>(
  apiCall: (token: string) => Promise<T>,
  token: string,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<T> => {
  try {
    // First, check if token is about to expire and refresh if needed
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    
    // Get the latest token after potential refresh
    const auth = selectAuthState(getState());
    const currentToken = auth.tokens?.accessToken || token;
    
    // Try the API call with the current token
    return await apiCall(currentToken);
  } catch (err: any) {
    // If the error is due to token expiration
    const auth = selectAuthState(getState());
    const isTokenError = 
      err?.response?.status === 401 || 
      (err?.errors && err?.errors[0]?.message === 'Token expired.') ||
      err?.message?.includes('401') ||
      err?.message?.includes('Token expired');
    
    if (isTokenError && auth.tokens?.refreshToken) {
      console.log('Token expired during API call in activitySlice. Attempting to refresh...');
      
      try {
        // Try to refresh the token
        const { tokens } = await dispatch(refresh()).unwrap();
        if (!tokens?.accessToken) throw new Error('Token refresh failed');
        
        console.log('Token refreshed successfully in activitySlice. Retrying API call...');
        // Retry the API call with the new token
        return await apiCall(tokens.accessToken);
      } catch (refreshError: any) {
        console.error('Failed to refresh token in activitySlice:', refreshError);
        // If refresh fails, log the user out
        dispatch(logout());
        throw new Error('Authentication expired. Please log in again.');
      }
    }
    
    // If it's not a token issue or refresh failed, rethrow the original error
    throw new Error(String(err?.message ?? err));
  }
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Interface for creating a new activity
 * ────────────────────────────────────────────────────────────────────────────────*/
export interface CreateActivityPayload {
  activity_type: number;
  activity_date_and_time: string;
  location: string;
  activity_details?: string;
  status: 'draft' | 'published' | 'archived' | string;
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to create a new activity
 * ────────────────────────────────────────────────────────────────────────────────*/
export const createActivity = createAsyncThunk<
  Activity,
  CreateActivityPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/create', async (payload, { getState, dispatch, rejectWithValue }) => {
  try {
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const createActivityRequest = async (accessToken: string) => {
      const response = await apiRequest<{ data: Activity }>(
        '/items/Activities',
        'POST',
        accessToken,
        payload
      );
      if (!response.data) throw new Error('Failed to create activity');
      return response.data;
    };

    return await executeWithTokenRefresh(createActivityRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Create activity error:', error);
    return rejectWithValue(error.message || 'Failed to create activity');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch activities
 * ────────────────────────────────────────────────────────────────────────────────*/
export const fetchActivities = createAsyncThunk<
  Activity[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/fetch', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchActivitiesRequest = async (accessToken: string) => {
      console.log('Fetching activities:', Platform.OS);
      
      const response = await apiRequest<{ data: Activity[] }>(
        '/items/Activities?sort=-activity_date_and_time&fields=*',
        'GET',
        accessToken
      );
      
      if (!response.data) throw new Error('Failed to fetch activities');
      return response.data;
    };

    return await executeWithTokenRefresh(fetchActivitiesRequest, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch activities error:', error);
    return rejectWithValue(error.message || 'Failed to fetch activities');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Slice
 * ────────────────────────────────────────────────────────────────────────────────*/
const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    clearActivities(state) {
      activitiesAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActivities.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action: PayloadAction<Activity[]>) => {
        state.status = 'succeeded';
        activitiesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch activities';
      })
      .addCase(createActivity.pending, state => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
        state.createStatus = 'succeeded';
        activitiesAdapter.addOne(state, action.payload);
      })
      .addCase(createActivity.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload ?? 'Failed to create activity';
      });
  },
});

export const { clearActivities } = activitiesSlice.actions;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors (with safe fallback)
 * ────────────────────────────────────────────────────────────────────────────────*/
const selectActivitiesState = (state: RootState): ActivitiesState =>
  // In case the reducer key is missing (e.g., during hot‑reload) fall back to initial state
  (state as any).activities ?? (initialState as ActivitiesState);

export const {
  selectAll: selectAllActivities,
  selectById: selectActivityById,
  selectIds: selectActivityIds,
  selectEntities: selectActivityEntities,
  selectTotal: selectTotalActivities,
} = activitiesAdapter.getSelectors(selectActivitiesState);

export const selectActivitiesStatus = (state: RootState) => selectActivitiesState(state).status;
export const selectActivitiesError = (state: RootState) => selectActivitiesState(state).error;
export const selectCreateActivityStatus = (state: RootState) => selectActivitiesState(state).createStatus;
export const selectCreateActivityError = (state: RootState) => selectActivitiesState(state).createError;

export default activitiesSlice.reducer;