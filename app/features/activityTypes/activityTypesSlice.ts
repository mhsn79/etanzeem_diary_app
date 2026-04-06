import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import  { directApiRequest } from '../../services/apiClient';

// Define the ActivityType interface
export interface ActivityType {
  id: number;
  Name: string;
  Name_plural?: string;
  [key: string]: any; // Allow for additional fields
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────*/
const activityTypesAdapter = createEntityAdapter<ActivityType>({
  selectId: activityType => activityType.id,
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
>('activityTypes/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    if (!getState().auth.tokens?.accessToken) return [];

    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<{ data: ActivityType[] }>(
      '/items/Activity_Type?fields=id,Name,Name_plural,Level_id&sort=sort,id',
      'GET'
    );
    
    return response.data ?? [];
  } catch (error: any) {
    console.warn('Fetch activity types error:', error);
    const errorMsg = error?.message || '';
    if (errorMsg.includes('permission') || errorMsg.includes('FORBIDDEN')) return [];
    return rejectWithValue('ڈیٹا لوڈ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
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