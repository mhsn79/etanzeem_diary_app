import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import { Activity } from '@/src/types/Activity';
import { directApiRequest } from '../../services/apiClient';
import { Platform } from 'react-native';
import { setUserUnitDetails } from '../tanzeem/tanzeemSlice';

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
  editStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  editError: string | null;
  fetchByIdStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  fetchByIdError: string | null;
  activityCountStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  activityCountError: string | null;
  activityCount: number | null;
  lastFetchTime: number;
}

export type ActivitiesState = ReturnType<typeof activitiesAdapter.getInitialState<ActivitiesExtraState>>;

const initialState: ActivitiesState = activitiesAdapter.getInitialState<ActivitiesExtraState>({
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  deleteStatus: 'idle',
  deleteError: null,
  editStatus: 'idle',
  editError: null,
  fetchByIdStatus: 'idle',
  fetchByIdError: null,
  activityCountStatus: 'idle',
  activityCountError: null,
  activityCount: null,
  lastFetchTime: 0,
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
 * Thunk to fetch a single activity by ID
 * ────────────────────────────────────────────────────────────────────────────────*/
export const fetchActivityById = createAsyncThunk<
  Activity,
  string | number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/fetchById', async (activityId, { rejectWithValue, getState }) => {
  try {
    console.log(`Fetching activity with ID: ${activityId}`);
    
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    
    if (!userId) {
      return rejectWithValue('User not authenticated. Please log in again.');
    }
    
    // Fetch the activity by ID
    const response = await directApiRequest<{ data: Activity }>(
      `/items/Activities/${activityId}`,
      'GET'
    );
    
    if (!response.data) throw new Error('Activity not found');
    return response.data;
  } catch (error: any) {
    console.error('Fetch activity by ID error:', error);
    return rejectWithValue(error.message || 'Failed to fetch activity');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to edit an activity
 * ────────────────────────────────────────────────────────────────────────────────*/
export const editActivity = createAsyncThunk<
  Activity,
  { id: number; activityData: Partial<Activity> },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/edit', async ({ id, activityData }, { rejectWithValue, getState, dispatch }) => {
  try {
    console.log(`Editing activity with ID: ${id}`, activityData);
    
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    
    if (!userId) {
      return rejectWithValue('User not authenticated. Please log in again.');
    }
    
    // First, fetch the activity to verify ownership
    const response = await directApiRequest<{ data: Activity }>(
      `/items/Activities/${id}`,
      'GET'
    );
    
    if (!response.data) {
      throw new Error('Activity not found');
    }
    
    // Verify that the current user is the creator of the activity
    if (String(response.data.user_created) !== String(userId)) {
      console.log(`User ID mismatch: ${response.data.user_created} !== ${userId}`);
      return rejectWithValue('Unauthorized: You cannot edit this activity');
    }
    
    // Update the activity
    const updateResponse = await directApiRequest<{ data: Activity }>(
      `/items/Activities/${id}`,
      'PATCH',
      activityData
    );
    
    if (!updateResponse.data) {
      throw new Error('Failed to update activity');
    }
    
    // Refresh the activities list
    dispatch(fetchActivities());
    
    return updateResponse.data;
  } catch (error: any) {
    console.error('Edit activity error:', error);
    return rejectWithValue(error.message || 'Failed to edit activity');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch activities. Pass { signal } to abort when screen blurs (avoids Fabric "Unable to find viewState").
 * ────────────────────────────────────────────────────────────────────────────────*/
export const fetchActivities = createAsyncThunk<
  Activity[],
  void | { signal?: AbortSignal },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/fetch', async (arg, { rejectWithValue, getState }) => {
  const signal = (typeof arg === 'object' && arg != null && 'signal' in arg) ? arg.signal : undefined;
  try {
    console.log('[Activities] Fetching activities:', Platform.OS);
    
    const state = getState();
    const userId = state.auth.user?.id;
    
    if (!userId) {
      return rejectWithValue('User not authenticated. Please log in again.');
    }
    
    // Filter by user's unit and sub-unit hierarchy (backend filter, not UI)
    const userUnitHierarchyIds = state.tanzeem?.userUnitHierarchyIds ?? [];
    const userUnitId = state.tanzeem?.userUnitDetails?.id;
    const unitIds: number[] = userUnitHierarchyIds.length > 0
      ? userUnitHierarchyIds
      : (userUnitId != null ? [userUnitId] : []);
    
    if (unitIds.length === 0) {
      console.log('[Activities] No unit context yet, skipping fetch');
      return [];
    }
    
    const currentActivities = state.activities?.ids?.length || 0;
    const lastFetchTime = state.activities?.lastFetchTime || 0;
    const now = Date.now();
    
    if (currentActivities > 0 && lastFetchTime > 0 && (now - lastFetchTime) < 30000) {
      console.log('[Activities] Activities already loaded recently, skipping fetch');
      return state.activities?.entities ? Object.values(state.activities.entities).filter(Boolean) as Activity[] : [];
    }
    
    if (lastFetchTime === 0) {
      console.log('[Activities] Activities cleared due to unit change, fetching fresh data');
    }
    
    // Backend filter: only activities belonging to user's unit and its sub-units (field: tanzeemi_unit)
    const unitFilter = unitIds.length === 1
      ? `filter[tanzeemi_unit][_eq]=${unitIds[0]}`
      : `filter[tanzeemi_unit][_in]=${unitIds.join(',')}`;
    const endpoint = `/items/Activities?sort=-activity_date_and_time&fields=*&filter[status][_neq]=archived&${unitFilter}`;
    
    const response = await directApiRequest<{ data: Activity[] }>(
      endpoint,
      'GET',
      undefined,
      signal
    );
    
    if (!response.data) throw new Error('Failed to fetch activities');
    const count = Array.isArray(response.data) ? response.data.length : 0;
    console.log('[Activities] Activities loaded successfully:', count, 'activities (filtered by unit hierarchy)');
    return response.data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return rejectWithValue('aborted');
    }
    console.error('Fetch activities error:', error);
    return rejectWithValue(error.message || 'Failed to fetch activities');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch activity count based on filters
 * ────────────────────────────────────────────────────────────────────────────────*/
export const fetchActivityCount = createAsyncThunk<
  number,
  { linkedToId: number; questionId: number; reportingPeriod?: { month: number; year: number } },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activities/fetchCount', async ({ linkedToId, questionId, reportingPeriod }, { rejectWithValue, getState }) => {
  try {
    console.log(`[ACTIVITY_COUNT] 🚀 Starting activity count fetch for question ${questionId}`);
    console.log(`[ACTIVITY_COUNT] 🔗 Using linked_to_id:`, linkedToId);
    
    // Get the current user ID from auth state
    const state = getState();
    const userId = state.auth.user?.id;
    const userToken = state.auth.tokens?.accessToken;
    
    // Get user's unit hierarchy IDs from tanzeem state
    const userUnitHierarchyIds = state.tanzeem?.userUnitHierarchyIds ?? [];
    
    console.log(`[ACTIVITY_COUNT] 👤 User ID: ${userId}`);
    console.log(`[ACTIVITY_COUNT] 🔑 Token available: ${!!userToken}`);
    console.log(`[ACTIVITY_COUNT] 🏢 User unit hierarchy IDs:`, userUnitHierarchyIds);
    
    if (!userId) {
      console.error(`[ACTIVITY_COUNT] ❌ No user ID found in auth state`);
      return rejectWithValue('User not authenticated. Please log in again.');
    }

    if (!linkedToId) {
      console.warn('[ACTIVITY_COUNT] ⚠️ No linked_to_id provided');
      return 0;
    }

    if (!userUnitHierarchyIds.length) {
      console.warn('[ACTIVITY_COUNT] ⚠️ No user unit hierarchy IDs found');
      return 0;
    }

    // Step 1: Get Activity_Type IDs that match both the linked_to_id AND the hierarchy
    const activityTypeFilter = `filter[id][_eq]=${linkedToId}&filter[Level_id][_in]=${userUnitHierarchyIds.join(',')}`;
    const activityTypeQuery = `/items/Activity_Type?${activityTypeFilter}`;
    
    console.log(`[ACTIVITY_COUNT] 🔍 Step 1 - Activity Type Query: ${activityTypeQuery}`);
    
    const activityTypeResponse = await directApiRequest<{ data: any[] }>(
      activityTypeQuery,
      'GET'
    );
    
    console.log(`[ACTIVITY_COUNT] 📥 Activity Type Response:`, activityTypeResponse);
    
    // Check if the Activity_Type exists and matches hierarchy
    if (!activityTypeResponse.data || activityTypeResponse.data.length === 0) {
      console.log(`[ACTIVITY_COUNT] ⚠️ No Activity_Type found with id=${linkedToId} and Level_id in hierarchy`);
      return 0;
    }
    
    // Step 2: Get activities count using the validated activity_type, for reporting period and published status
    const month = reportingPeriod?.month || (new Date().getMonth() + 1);
    const year = reportingPeriod?.year || new Date().getFullYear();
    const activityFilter = `filter[activity_type][_eq]=${linkedToId}&filter[report_month][_eq]=${month}&filter[report_year][_eq]=${year}&filter[status][_eq]=published`;
    const activityQuery = `/items/Activities?${activityFilter}`;
    
    console.log(`[ACTIVITY_COUNT] 🔍 Step 2 - Activity Query: ${activityQuery}`);
    console.log(`[ACTIVITY_COUNT] 📅 Using reporting period: month=${month}, year=${year}`);
    
    const activityResponse = await directApiRequest<{ data: any[], meta?: { filter_count?: number } }>(
      activityQuery,
      'GET'
    );
    
    console.log(`[ACTIVITY_COUNT] 📥 Activity Response:`, activityResponse);

    let activityCount = 0;
    if (activityResponse.meta?.filter_count !== undefined) {
      activityCount = activityResponse.meta.filter_count;
      console.log(`[ACTIVITY_COUNT] ✅ Success! Activity count from meta: ${activityCount}`);
    } else if (activityResponse.data) {
      activityCount = activityResponse.data.length;
      console.log(`[ACTIVITY_COUNT] ✅ Success! Activity count from data length: ${activityCount}`);
    } else {
      throw new Error('No count information in response');
    }

    console.log(`[ACTIVITY_COUNT] 🎯 Final activity count result: ${activityCount}`);
    return activityCount;
  } catch (error: any) {
    console.error('[ACTIVITY_COUNT] 💥 Critical error in fetchActivityCount:', error);
    console.error('[ACTIVITY_COUNT] 📋 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return rejectWithValue(error.message || 'Failed to fetch activity count');
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
      state.lastFetchTime = 0;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActivities.pending, state => {
        // Keep existing list mounted during background refreshes.
        // Switching whole screen to "loading" while navigating can trigger Fabric
        // viewState tag crashes on Android.
        if ((state.ids?.length ?? 0) === 0) {
          state.status = 'loading';
        }
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action: PayloadAction<Activity[]>) => {
        state.status = 'succeeded';
        state.lastFetchTime = Date.now();
        activitiesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        if (action.payload === 'aborted') return; // Screen blurred; don't update UI
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
      })
      .addCase(fetchActivityById.pending, state => {
        state.fetchByIdStatus = 'loading';
        state.fetchByIdError = null;
      })
      .addCase(fetchActivityById.fulfilled, (state, action: PayloadAction<Activity>) => {
        state.fetchByIdStatus = 'succeeded';
        activitiesAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchActivityById.rejected, (state, action) => {
        state.fetchByIdStatus = 'failed';
        state.fetchByIdError = action.payload ?? 'Failed to fetch activity';
      })
      .addCase(editActivity.pending, state => {
        state.editStatus = 'loading';
        state.editError = null;
      })
      .addCase(editActivity.fulfilled, (state, action: PayloadAction<Activity>) => {
        state.editStatus = 'succeeded';
        activitiesAdapter.upsertOne(state, action.payload);
      })
      .addCase(editActivity.rejected, (state, action) => {
        state.editStatus = 'failed';
        state.editError = action.payload ?? 'Failed to edit activity';
      })
      .addCase(fetchActivityCount.pending, state => {
        state.activityCountStatus = 'loading';
        state.activityCountError = null;
      })
      .addCase(fetchActivityCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.activityCountStatus = 'succeeded';
        state.activityCount = action.payload;
      })
      .addCase(fetchActivityCount.rejected, (state, action) => {
        state.activityCountStatus = 'failed';
        state.activityCountError = action.payload ?? 'Failed to fetch activity count';
      })
      // Clear activities when user unit changes to prevent UI crashes
      .addCase(setUserUnitDetails, (state) => {
        console.log('[Activities] Clearing activities due to user unit change');
        activitiesAdapter.removeAll(state);
        state.status = 'idle';
        state.error = null;
        state.lastFetchTime = 0; // Reset fetch time to force fresh fetch
        console.log('[Activities] Activities cleared, status reset to idle');
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
export const selectEditActivityStatus = (state: RootState) => selectActivitiesState(state).editStatus;
export const selectEditActivityError = (state: RootState) => selectActivitiesState(state).editError;
export const selectFetchActivityByIdStatus = (state: RootState) => selectActivitiesState(state).fetchByIdStatus;
export const selectFetchActivityByIdError = (state: RootState) => selectActivitiesState(state).fetchByIdError;

// Activity count selectors
export const selectActivityCountStatus = (state: RootState) => selectActivitiesState(state).activityCountStatus;
export const selectActivityCountError = (state: RootState) => selectActivitiesState(state).activityCountError;
export const selectActivityCount = (state: RootState) => selectActivitiesState(state).activityCount;

// Custom selector to get an activity by ID (using our own implementation)
export const getActivityById = (id: string | number) => 
  (state: RootState) => selectActivityEntities(state)[typeof id === 'string' ? parseInt(id) : id];

// Selector to get scheduled activities for the next 72 hours (3 days)
export const selectScheduledActivitiesNext72Hours = createSelector(
  [selectAllActivities],
  (allActivities: Activity[]) => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (72 * 60 * 60 * 1000)); // 72 hours from now
    
    return allActivities.filter((activity: Activity) => {
      // Include both published and draft activities (but not archived)
      if (activity.status === 'archived') {
        return false;
      }
      
      // Parse the activity date
      const activityDate = new Date(activity.activity_date_and_time);
      
      // Check if the activity is today or in the future and within the next 72 hours
      const isTodayOrFuture = activityDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
      const isWithin72Hours = activityDate <= threeDaysFromNow;
      
      return isTodayOrFuture && isWithin72Hours;
    });
  }
);

export default activitiesSlice.reducer;