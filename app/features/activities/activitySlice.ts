import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  isTokenExpiredOrExpiring,
  refresh,
  checkAndRefreshTokenIfNeeded,
} from '../auth/authSlice';
import { Activity } from '@/src/types/Activity';

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
  // Refresh token if needed (does not throw on failure)
  await dispatch(checkAndRefreshTokenIfNeeded());

  const auth = selectAuthState(getState());
  let token = auth.tokens?.accessToken;
  if (!token) return rejectWithValue('No access token');

  const tryCreate = async (bearer: string) => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
    const res = await fetch(`${baseUrl}/items/Activities`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${bearer}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `Failed to create activity with status ${res.status}`);
    }
    
    const json = await res.json();
    return json.data as Activity;
  };

  try {
    return await tryCreate(token);
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      // try refresh once
      const { tokens } = await dispatch(refresh()).unwrap();
      if (!tokens?.accessToken) return rejectWithValue('Refresh failed');
      return await tryCreate(tokens.accessToken);
    }
    return rejectWithValue(msg);
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
  // Refresh token if needed (does not throw on failure)
  await dispatch(checkAndRefreshTokenIfNeeded());

  const auth = selectAuthState(getState());
  let token = auth.tokens?.accessToken;
  if (!token) return rejectWithValue('No access token');

  const tryFetch = async (bearer: string) => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
    const res = await fetch(`${baseUrl}/items/Activities?sort=-activity_date_and_time&fields=*`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return (json.data ?? []) as Activity[];
  };

  try {
    return await tryFetch(token);
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      // try refresh once
      const { tokens } = await dispatch(refresh()).unwrap();
      if (!tokens?.accessToken) return rejectWithValue('Refresh failed');
      return await tryFetch(tokens.accessToken);
    }
    return rejectWithValue(msg);
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