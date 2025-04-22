import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  isTokenExpiredOrExpiring,
  refresh,
  checkAndRefreshTokenIfNeeded,
} from '../auth/authSlice';

// Define the ActivityType interface
export interface ActivityType {
  id: number;
  Name: string;
  Description?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────*/
const activityTypesAdapter = createEntityAdapter<ActivityType>({
  selectId: activityType => activityType.id,
  sortComparer: (a, b) => a.Name.localeCompare(b.Name),
});

interface ActivityTypesExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createError: string | null;
}

export type ActivityTypesState = ReturnType<typeof activityTypesAdapter.getInitialState<ActivityTypesExtraState>>;

const initialState: ActivityTypesState = activityTypesAdapter.getInitialState<ActivityTypesExtraState>({
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch activity types
 * ────────────────────────────────────────────────────────────────────────────────*/
export const fetchActivityTypes = createAsyncThunk<
  ActivityType[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('activityTypes/fetch', async (_, { getState, dispatch, rejectWithValue }) => {
  // Refresh token if needed (does not throw on failure)
  await dispatch(checkAndRefreshTokenIfNeeded());

  const auth = selectAuthState(getState());
  let token = auth.tokens?.accessToken;
  if (!token) return rejectWithValue('No access token');

  const tryFetch = async (bearer: string) => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://139.59.232.231:8055';
    const res = await fetch(`${baseUrl}/items/Activity_Type?fields=*`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return (json.data ?? []) as ActivityType[];
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
const activityTypesSlice = createSlice({
  name: 'activityTypes',
  initialState,
  reducers: {
    clearActivityTypes(state) {
      activityTypesAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActivityTypes.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchActivityTypes.fulfilled, (state, action: PayloadAction<ActivityType[]>) => {
        state.status = 'succeeded';
        activityTypesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchActivityTypes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch activity types';
      });
  },
});

export const { clearActivityTypes } = activityTypesSlice.actions;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors (with safe fallback)
 * ────────────────────────────────────────────────────────────────────────────────*/
const selectActivityTypesState = (state: RootState): ActivityTypesState =>
  // In case the reducer key is missing (e.g., during hot‑reload) fall back to initial state
  (state as any).activityTypes ?? (initialState as ActivityTypesState);

export const {
  selectAll: selectAllActivityTypes,
  selectById: selectActivityTypeById,
  selectIds: selectActivityTypeIds,
  selectEntities: selectActivityTypeEntities,
  selectTotal: selectTotalActivityTypes,
} = activityTypesAdapter.getSelectors(selectActivityTypesState);

export const selectActivityTypesStatus = (state: RootState) => selectActivityTypesState(state).status;
export const selectActivityTypesError = (state: RootState) => selectActivityTypesState(state).error;

export default activityTypesSlice.reducer;