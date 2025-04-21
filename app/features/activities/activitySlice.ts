import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { selectAccessToken } from '../auth/authSlice';

export interface Activity {
  id: number;
  status: string;      // "draft" | "published" | …
  activity_date_and_time: string; // ISO string
  location_coordinates: string | null; // lat,lng
  activity_details: string | null;
  // include every field returned by /items/Activities
}

interface ActivitiesState {
  list: Activity[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ActivitiesState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchActivities = createAsyncThunk<
  Activity[],                // return type
  void,                      // params
  { state: RootState }       // thunkAPI for token access
>('activities/fetchActivities', async (_, { getState, rejectWithValue }) => {
  const token = selectAccessToken(getState());
  if (!token) return rejectWithValue('No token');

  try {
    const res = await fetch(
      'http://139.59.232.231:8055/items/Activities',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      const errText = await res.text();
      return rejectWithValue(errText || 'Request failed');
    }
    const json = await res.json();      // json.data is the array
    return json.data as Activity[];
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error occurred');
  }
});

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    clearActivities(state) {
      state.list = [];
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
        state.list = action.payload;
        state.error = null;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { clearActivities } = activitiesSlice.actions;

// Selectors
export const selectActivities = (state: RootState) => state.activities.list;
export const selectActivitiesStatus = (state: RootState) => state.activities.status;
export const selectActivitiesError = (state: RootState) => state.activities.error;

export default activitiesSlice.reducer; 