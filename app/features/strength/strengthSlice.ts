import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import apiRequest from '../../services/apiClient';

// Types
export interface StrengthType {
  id: number;
  Name_Singular: string;
  Name_Plural: string;
  Gender: string; // "M", "F", "NA"
  Category: string; // "workforce", "place", "magazine"
  Reporting_Unit_Level: number;
}

export interface StrengthRecord {
  id: number;
  Tanzeemi_Unit: number;
  Type: number; // Links to StrengthType.id
  Value: number;
  change_type: string; // "plus" or "minus"
  new_total: number;
  Reporting_Time: string;
}

export interface StrengthState {
  strengthTypes: StrengthType[];
  strengthRecords: StrengthRecord[];
  loading: boolean;
  error: string | null;
  recordsLoading: boolean;
  recordsError: string | null;
}

// Initial state
const initialState: StrengthState = {
  strengthTypes: [],
  strengthRecords: [],
  loading: false,
  error: null,
  recordsLoading: false,
  recordsError: null,
};

// Helper to normalize API response
const normalizeResponse = <T>(response: T | { data: T }, entity: string): T => {
  if (Array.isArray(response)) {
    return response;
  }
  
  // Check if response is an object and has 'data' property
  if (response !== null && typeof response === 'object' && 'data' in response) {
    const typedResponse = response as { data: T };
    // Only return data if it's not null or undefined
    if (typedResponse.data !== null && typedResponse.data !== undefined) {
      return typedResponse.data;
    }
    // If data is null/undefined, we need to cast the response to T (this is a fallback)
    return response as T;
  }
  
  // If it's a direct value of type T
  if (response !== undefined) {
    return response as T;
  }
  
  throw new Error(`Invalid ${entity} response format`);
};

// Async thunks
export const fetchStrengthTypes = createAsyncThunk<
  StrengthType[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchStrengthTypes', async (_, { rejectWithValue }) => {
  try {
    // Filter to include only types where Category is "workforce" and Reporting_Unit_Level is 6
    const params = {
      filter: { 
        Category: { _eq: 'workforce' },
        Reporting_Unit_Level: { _eq: 6 }
      },
      sort: 'id'
    };

    // The centralized API client handles token refresh automatically
    const response = await apiRequest<StrengthType[] | { data: StrengthType[] }>(() => ({
      path: '/items/Strength_Type',
      method: 'GET',
      params,
    }));

    return normalizeResponse<StrengthType[]>(response, 'Strength Types');
  } catch (error: any) {
    console.error('Error in fetchStrengthTypes:', error);
    return rejectWithValue(error.message || 'Failed to fetch strength types');
  }
});

export const fetchStrengthRecords = createAsyncThunk<
  StrengthRecord[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchStrengthRecords', async (_, { getState, rejectWithValue }) => {
  try {
    const { tanzeem } = getState();
    const tanzeemiUnitIds = tanzeem?.ids ?? [];

    if (!tanzeemiUnitIds.length) {
      return [];
    }

    const params = {
      filter: { Tanzeemi_Unit: { _in: tanzeemiUnitIds } },
      sort: '-Reporting_Time', // Sort by most recent first
    };

    // The centralized API client handles token refresh automatically
    const response = await apiRequest<StrengthRecord[] | { data: StrengthRecord[] }>(() => ({
      path: '/items/Strength_Records',
      method: 'GET',
      params,
    }));

    return normalizeResponse<StrengthRecord[]>(response, 'Strength Records');
  } catch (error: any) {
    console.error('Error in fetchStrengthRecords:', error);
    return rejectWithValue(error.message || 'Failed to fetch strength records');
  }
});

export const updateStrengthRecord = createAsyncThunk<
  StrengthRecord,
  { id: number; Value: number; change_type: string; new_total: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/updateStrengthRecord', async (recordData, { dispatch, rejectWithValue }) => {
  try {
    const { id, ...updateData } = recordData;
    
    // Update the record
    const response = await apiRequest<StrengthRecord | { data: StrengthRecord }>(() => ({
      path: `/items/Strength_Records/${id}`,
      method: 'PATCH',
      data: updateData,
    }));

    const updatedRecord = normalizeResponse<StrengthRecord>(response, 'Updated Strength Record');
    
    // Refresh records after update
    dispatch(fetchStrengthRecords());
    
    return updatedRecord;
  } catch (error: any) {
    console.error('Error in updateStrengthRecord:', error);
    return rejectWithValue(error.message || 'Failed to update strength record');
  }
});

export const createStrengthRecord = createAsyncThunk<
  StrengthRecord,
  Omit<StrengthRecord, 'id'>,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/createStrengthRecord', async (recordData, { dispatch, rejectWithValue }) => {
  try {
    // Create a new record
    const response = await apiRequest<StrengthRecord | { data: StrengthRecord }>(() => ({
      path: '/items/Strength_Records',
      method: 'POST',
      data: recordData,
    }));

    const newRecord = normalizeResponse<StrengthRecord>(response, 'New Strength Record');
    
    // Refresh records after creation
    dispatch(fetchStrengthRecords());
    
    return newRecord;
  } catch (error: any) {
    console.error('Error in createStrengthRecord:', error);
    return rejectWithValue(error.message || 'Failed to create strength record');
  }
});

export const refreshStrengthData = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/refreshStrengthData', async (_, { dispatch }) => {
  await Promise.all([
    dispatch(fetchStrengthTypes()),
    dispatch(fetchStrengthRecords())
  ]);
});

// Slice
const strengthSlice = createSlice({
  name: 'strength',
  initialState,
  reducers: {
    clearStrengthTypes: (state) => {
      state.strengthTypes = [];
      state.loading = false;
      state.error = null;
    },
    clearStrengthRecords: (state) => {
      state.strengthRecords = [];
      state.recordsLoading = false;
      state.recordsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchStrengthTypes
      .addCase(fetchStrengthTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStrengthTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.strengthTypes = action.payload;
      })
      .addCase(fetchStrengthTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch strength types';
      })
      
      // fetchStrengthRecords
      .addCase(fetchStrengthRecords.pending, (state) => {
        state.recordsLoading = true;
        state.recordsError = null;
      })
      .addCase(fetchStrengthRecords.fulfilled, (state, action) => {
        state.recordsLoading = false;
        state.strengthRecords = action.payload;
      })
      .addCase(fetchStrengthRecords.rejected, (state, action) => {
        state.recordsLoading = false;
        state.recordsError = action.payload ?? 'Failed to fetch strength records';
      })
      
      // updateStrengthRecord - no state changes needed as we refresh records after update
      .addCase(updateStrengthRecord.rejected, (state, action) => {
        state.recordsError = action.payload ?? 'Failed to update strength record';
      })
      
      // createStrengthRecord - no state changes needed as we refresh records after creation
      .addCase(createStrengthRecord.rejected, (state, action) => {
        state.recordsError = action.payload ?? 'Failed to create strength record';
      });
  },
});

// Selectors
export const selectStrengthState = (state: RootState) => state.strength;
export const selectStrengthTypes = (state: RootState) => state.strength.strengthTypes;
export const selectStrengthRecords = (state: RootState) => state.strength.strengthRecords;
export const selectStrengthLoading = (state: RootState) => state.strength.loading;
export const selectStrengthError = (state: RootState) => state.strength.error;
export const selectStrengthRecordsLoading = (state: RootState) => state.strength.recordsLoading;
export const selectStrengthRecordsError = (state: RootState) => state.strength.recordsError;

// Memoized selectors
export const selectStrengthByGender = createSelector(
  [selectStrengthTypes],
  (types) => {
    return {
      male: types.filter(type => type.Gender === 'M'),
      female: types.filter(type => type.Gender === 'F'),
      other: types.filter(type => type.Gender === 'NA')
    };
  }
);

export const selectLatestStrengthRecordsByType = createSelector(
  [selectStrengthRecords],
  (records) => {
    // Group records by Type and get the latest for each Type
    const recordsByType = records.reduce((acc, record) => {
      if (!acc[record.Type] || new Date(record.Reporting_Time) > new Date(acc[record.Type].Reporting_Time)) {
        acc[record.Type] = record;
      }
      return acc;
    }, {} as Record<number, StrengthRecord>);
    
    return recordsByType;
  }
);

export const selectStrengthValueByType = createSelector(
  [selectLatestStrengthRecordsByType, (_state: RootState, typeId: number) => typeId],
  (recordsByType, typeId) => {
    return recordsByType[typeId]?.new_total || 0;
  }
);

export const selectTotalStrengthValue = createSelector(
  [selectLatestStrengthRecordsByType],
  (recordsByType) => {
    return Object.values(recordsByType).reduce((total, record) => total + record.new_total, 0);
  }
);

export const selectTotalChangeValue = createSelector(
  [selectStrengthRecords],
  (records) => {
    // Calculate total change from all records
    return records.reduce((total, record) => {
      const changeValue = record.change_type === 'plus' ? record.Value : -record.Value;
      return total + changeValue;
    }, 0);
  }
);

// Exports
export const { clearStrengthTypes, clearStrengthRecords } = strengthSlice.actions;
export default strengthSlice.reducer;