import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import { Activity } from '@/src/types/Activity';
import apiClient, { directApiRequest } from '../../services/apiClient';
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
  deleteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  deleteError: string | null;
}

export type ActivitiesState = ReturnType<typeof activitiesAdapter.getInitialState<ActivitiesExtraState>>;

const initialState: ActivitiesState = activitiesAdapter.getInitialState<ActivitiesExtraState>({
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  deleteStatus: 'idle',
  deleteError: null,
});

// The centralized API client handles token refresh automatically

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Interface for creating a new activity
 * ────────────────────────────────────────────────────────────────────────────────*/
export interface CreateActivityPayload {
  activity_type: number;
  activity_date_and_time: string;
  location: string;
  activity_details?: string;
  activity_summary?: string | null;
  attendance?: number | null;
  status: 'draft' | 'published' | 'archived' | string;
  report_month?: number;
  report_year?: number;
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to create a new activity
 * ────────────────────────────────────────────────────────────────────────────────*/
export const createActivity = createAsyncThunk<
  Activity,
  CreateActivityPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/create', async (payload, { rejectWithValue, getState }) => {
  try {
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    
    if (!userId) {
      return rejectWithValue('User not authenticated. Please log in again.');
    }
  
    
    // Extract date from activity_date_and_time to set report_month and report_year
    const activityDate = new Date(payload.activity_date_and_time);
    
    // Create the complete payload with all required fields
    // Don't include user_created in the payload - let the server handle it based on the auth token
    const completePayload = {
      ...payload,
      report_month: payload.report_month || activityDate.getMonth() + 1, // Months are 0-indexed in JS
      report_year: payload.report_year || activityDate.getFullYear()
    };
    
    // The centralized API client handles token refresh automatically
    const response = await directApiRequest<{ data: Activity }>(
      '/items/Activities',
      'POST',
      completePayload
    );
    
    if (!response.data) throw new Error('Failed to create activity');
    return response.data;
  } catch (error: any) {
    console.error('Create activity error:', error);
    return rejectWithValue(error.message || 'Failed to create activity');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to delete an activity
 * ────────────────────────────────────────────────────────────────────────────────*/
export const deleteActivity = createAsyncThunk<
  number,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/delete', async (activityId, { rejectWithValue, getState, dispatch }) => {
  try {
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    
    if (!userId) {
      return rejectWithValue('User not authenticated. Please log in again.');
    }
    
    // First, fetch the activity to verify ownership
    const response = await directApiRequest<{ data: Activity }>(
      `/items/Activities/${activityId}`,
      'GET'
    );
    
    if (!response.data) {
      throw new Error('Activity not found');
    }
    
    // Verify that the current user is the creator of the activity
    // Use String() to ensure consistent comparison

    console.log(`Deleting activity with ID: ${activityId}`);
    
    // Instead of deleting, update the status to "archived"
    await directApiRequest(
      `/items/Activities/${activityId}`,
      'PATCH',
      { status: 'archived' }
    );
    
    // Refresh the activities list to get the latest data
    dispatch(fetchActivities());
    
    return activityId;
  } catch (error: any) {
    console.error('Delete activity error:', error);
    return rejectWithValue(error.message || 'Failed to delete activity');
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
>('activities/fetch', async (_, { rejectWithValue, getState }) => {
  try {
    console.log('Fetching activities:', Platform.OS);
    
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    
    if (!userId) {
      return rejectWithValue('User not authenticated. Please log in again.');
    }
    
    // Use directApiRequest which uses fetch directly for more reliable results
    // Fetch all activities except archived ones
    const response = await directApiRequest<{ data: Activity[] }>(
      `/items/Activities?sort=-activity_date_and_time&fields=*&filter[status][_neq]=archived`,
      'GET'
    );
    
    
    if (!response.data) throw new Error('Failed to fetch activities');
    return response.data;
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
      })
      .addCase(deleteActivity.pending, state => {
        state.deleteStatus = 'loading';
        state.deleteError = null;
      })
      .addCase(deleteActivity.fulfilled, (state, action: PayloadAction<number>) => {
        state.deleteStatus = 'succeeded';
        // We don't need to remove the activity from the state here
        // as fetchActivities will be called after archiving to refresh the list
      })
      .addCase(deleteActivity.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = action.payload ?? 'Failed to delete activity';
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
export const selectDeleteActivityStatus = (state: RootState) => selectActivitiesState(state).deleteStatus;
export const selectDeleteActivityError = (state: RootState) => selectActivitiesState(state).deleteError;

export default activitiesSlice.reducer;