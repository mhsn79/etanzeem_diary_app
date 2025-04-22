import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { 
  selectAccessToken, 
  refresh, 
  selectAuthState, 
  isTokenExpiredOrExpiring,
  checkAndRefreshTokenIfNeeded
} from '../auth/authSlice';
import directus from '../../services/directus';
import { AppDispatch } from '../../store';

// Enhanced Activity interface
export interface Activity {
  id: number;
  status: 'draft' | 'published' | 'archived' | string;
  activity_date_and_time: string; // ISO string
  location_coordinates: string | null; // lat,lng
  activity_details: string | null;
  created_at: string;
  updated_at: string;
  user_created: string;
  user_updated: string | null;
  // Add any other fields that might be returned by the API
  title?: string;
  description?: string;
  location_name?: string;
  activity_type?: string;
  participants?: number[];
  attachments?: string[];
  [key: string]: any; // Allow for additional fields
}

// Directus response type
interface DirectusResponse<T> {
  data: T;
  meta: {
    total_count: number;
    filter_count: number;
  };
}

// Create entity adapter for normalized state
const activitiesAdapter = createEntityAdapter<Activity>({
  selectId: (activity) => activity.id,
  sortComparer: (a, b) => 
    new Date(b.activity_date_and_time).getTime() - new Date(a.activity_date_and_time).getTime(),
});

// Enhanced state interface
interface ActivitiesState extends ReturnType<typeof activitiesAdapter.getInitialState> {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ActivitiesState = activitiesAdapter.getInitialState({
  status: 'idle',
  error: null,
});

// Enhanced fetch activities thunk
// Define the return type for the helper function
interface FetchActivitiesSuccess {
  ok: true;
  data: Activity[];
}

interface FetchActivitiesError {
  ok: false;
  errorMessage: string;
  isTokenExpired: boolean;
}

type FetchActivitiesResult = FetchActivitiesSuccess | FetchActivitiesError;

// Helper function to fetch activities with a given token
const fetchActivitiesWithToken = async (
  token: string, 
  rejectWithValue: (value: string) => any
): Promise<FetchActivitiesResult> => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
  const url = new URL(`${baseUrl}/items/Activities`);
  
  // Add query parameters for sorting and fields
  url.searchParams.append('sort', '-activity_date_and_time');
  url.searchParams.append('fields', '*');
  
  const requestUrl = url.toString();
  console.log('Fetching activities from:', requestUrl);
  
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let isTokenExpired = false;
    
    try {
      // Try to parse error as JSON first
      const errorJson = await response.json();
      errorMessage = errorJson.errors?.[0]?.message || 
                    errorJson.message || 
                    errorJson.error || 
                    errorMessage;
      
      // Check if token is expired
      isTokenExpired = errorMessage.toLowerCase().includes('token expired') || 
                      errorMessage.toLowerCase().includes('invalid token') ||
                      response.status === 401;
    } catch {
      // If not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
          isTokenExpired = errorText.toLowerCase().includes('token expired') || 
                          errorText.toLowerCase().includes('invalid token');
        }
      } catch {
        // If text extraction fails, use default message
        isTokenExpired = response.status === 401;
      }
    }
    
    return { ok: false, errorMessage, isTokenExpired };
  }

  const json = await response.json();
  console.log('Activities response received:', {
    status: response.status,
    hasData: !!json.data,
    isArray: Array.isArray(json.data),
    count: Array.isArray(json.data) ? json.data.length : 0
  });
  
  if (!json.data || !Array.isArray(json.data)) {
    console.error('Unexpected response format:', json);
    return { 
      ok: false, 
      errorMessage: 'Unexpected response format from server',
      isTokenExpired: false
    };
  }
  
  return { ok: true, data: json.data as Activity[] };
};

export const fetchActivities = createAsyncThunk<
  Activity[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/fetchActivities', async (_, { getState, dispatch, rejectWithValue }) => {
  console.log('Fetching activities...');
  
  // First, check if token needs refreshing and refresh if needed
  try {
    await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
  } catch (error) {
    console.log('Proactive token refresh failed, will continue with current token');
  }
  
  // Get current auth state (after potential refresh)
  const authState = selectAuthState(getState());
  let token = authState.tokens?.accessToken;
  
  if (!token) {
    console.error('No access token available');
    return rejectWithValue('No access token available');
  }
  
  // Check if token is expired or about to expire
  if (authState.tokens && isTokenExpiredOrExpiring(authState.tokens.expiresAt)) {
    console.warn('Token appears to be expired or expiring soon, proceeding anyway');
  } else {
    console.log('Token is valid, proceeding with fetch');
  }
  
  try {
    // First attempt with current token
    let result = await fetchActivitiesWithToken(token, rejectWithValue);
    
    // If token is expired, try to refresh and fetch again
    if (!result.ok && result.isTokenExpired) {
      console.log('Token expired, attempting to refresh...');
      
      try {
        // Dispatch refresh action
        const refreshResult = await dispatch(refresh()).unwrap();
        
        if (refreshResult && refreshResult.tokens && refreshResult.tokens.accessToken) {
          console.log('Token refreshed successfully, retrying fetch...');
          
          // Retry with new token
          result = await fetchActivitiesWithToken(refreshResult.tokens.accessToken, rejectWithValue);
        } else {
          console.error('Token refresh failed');
          return rejectWithValue('Token refresh failed');
        }
      } catch (refreshError: any) {
        console.error('Error refreshing token:', refreshError);
        return rejectWithValue(refreshError?.message || 'Failed to refresh authentication token');
      }
    }
    
    // Return final result
    if (!result.ok) {
      console.error('Activities fetch error:', result.errorMessage);
      return rejectWithValue(result.errorMessage);
    }
    
    // Ensure we always return an array of activities
    if (!result.data || !Array.isArray(result.data)) {
      console.error('Invalid data format received');
      return rejectWithValue('Invalid data format received from server');
    }
    
    return result.data;
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to fetch activities';
    console.error('Activities fetch exception:', errorMessage);
    return rejectWithValue(errorMessage);
  }
});

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    clearActivities: (state) => {
      activitiesAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action: PayloadAction<Activity[]>) => {
        state.status = 'succeeded';
        activitiesAdapter.setAll(state, action.payload);
        state.error = null;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch activities';
      });
  },
});

export const { clearActivities } = activitiesSlice.actions;

// Enhanced selectors using the entity adapter
export const {
  selectAll: selectAllActivities,
  selectById: selectActivityById,
  selectIds: selectActivityIds,
  selectEntities: selectActivityEntities,
  selectTotal: selectTotalActivities,
} = activitiesAdapter.getSelectors((state: RootState) => state.activities);

export const selectActivitiesStatus = (state: RootState) => state.activities.status;
export const selectActivitiesError = (state: RootState) => state.activities.error;

export default activitiesSlice.reducer; 