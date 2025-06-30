import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import apiRequest, { directApiRequest } from '../../services/apiClient';

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
  Reporting_Time?: string;
}

export interface StrengthState {
  strengthTypes: StrengthType[];
  strengthRecords: StrengthRecord[];
  loading: boolean;
  error: string | null;
  recordsLoading: boolean;
  recordsError: string | null;
  userUnitId: number | null; // Store the user's unit ID for reference
  strengthCount: number;
  strengthTotals: Record<number, number>;
  strengthSum: number;
  strengthAvg: number;
}

// Initial state
const initialState: StrengthState = {
  strengthTypes: [],
  strengthRecords: [],
  loading: false,
  error: null,
  recordsLoading: false,
  recordsError: null,
  userUnitId: null,
  strengthCount: 0,
  strengthTotals: {},
  strengthSum: 0,
  strengthAvg: 0,
};

// Helper to normalize API response
const normalizeResponse = <T>(response: T | { data: T }, entity: string): T => {
  console.log(`[NORMALIZE_DEBUG] Normalizing ${entity} response`);
  console.log(`[NORMALIZE_DEBUG] Response type: ${typeof response}`);
  console.log(`[NORMALIZE_DEBUG] Is array: ${Array.isArray(response)}`);
  console.log(`[NORMALIZE_DEBUG] Is null: ${response === null}`);
  
  if (Array.isArray(response)) {
    console.log(`[NORMALIZE_DEBUG] Returning array directly, length: ${response.length}`);
    return response;
  }
  
  // Check if response is an object and has 'data' property
  if (response !== null && typeof response === 'object' && 'data' in response) {
    console.log(`[NORMALIZE_DEBUG] Response has 'data' property`);
    
    const typedResponse = response as { data: T };
    console.log(`[NORMALIZE_DEBUG] Data type: ${typeof typedResponse.data}`);
    console.log(`[NORMALIZE_DEBUG] Is data array: ${Array.isArray(typedResponse.data)}`);
    console.log(`[NORMALIZE_DEBUG] Data is null: ${typedResponse.data === null}`);
    console.log(`[NORMALIZE_DEBUG] Data is undefined: ${typedResponse.data === undefined}`);
    
    // Only return data if it's not null or undefined
    if (typedResponse.data !== null && typedResponse.data !== undefined) {
      console.log(`[NORMALIZE_DEBUG] Returning data from response`);
      if (Array.isArray(typedResponse.data)) {
        console.log(`[NORMALIZE_DEBUG] Data is array with length: ${typedResponse.data.length}`);
      }
      return typedResponse.data;
    }
    
    // If data is null/undefined, we need to cast the response to T (this is a fallback)
    console.log(`[NORMALIZE_DEBUG] Data is null/undefined, returning response as T`);
    return response as T;
  }
  
  // If it's a direct value of type T
  if (response !== undefined) {
    console.log(`[NORMALIZE_DEBUG] Response is a direct value, returning as is`);
    return response as T;
  }
  
  console.error(`[NORMALIZE_DEBUG] Invalid ${entity} response format:`, response);
  throw new Error(`Invalid ${entity} response format`);
};

// Async thunks
export const fetchStrengthTypes = createAsyncThunk<
  StrengthType[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchStrengthTypes', async (_, { getState, rejectWithValue }) => {
  try {
    // Get the user's unit details from the tanzeem slice
    const userUnitDetails = getState().tanzeem.userUnitDetails;
    const userUnitId = getState().strength.userUnitId;
    
    // If we don't have the user's unit details, return an empty array
    if (!userUnitDetails && !userUnitId) {
      console.warn('No user unit details available, cannot fetch strength types');
      return [];
    }
    
    // Get the unit level from the user's unit details or use a default
    const unitID = userUnitDetails?.id || userUnitDetails?.id;
    
    // Filter to include only types where Reporting_Unit_Level matches the user's unit level
    const params = {
      filter: { 
        Reporting_Unit_Level: { _eq: unitID  } // Default to level 6 if not available
      },
      sort: ['Category', 'id'] // Sort by Category first, then by ID
    };

    console.log(`[STRENGTH_DEBUG] Fetching strength types for unit level: ${unitID }`);
    console.log(`[STRENGTH_DEBUG] Request params:`, JSON.stringify(params, null, 2));

    // The centralized API client handles token refresh automatically
    const response = await apiRequest<StrengthType[] | { data: StrengthType[] }>(() => ({
      path: '/items/Strength_Type',
      method: 'GET',
      params,
    }));
    
    console.log('[STRENGTH_DEBUG] ===================== API RESPONSE ================');
    console.log('[STRENGTH_DEBUG] Response structure:', Object.keys(response));
    
    // Check if response has data property
    if ('data' in response && response.data) {
      console.log('[STRENGTH_DEBUG] Response has data property');
      console.log('[STRENGTH_DEBUG] Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      console.log('[STRENGTH_DEBUG] Response data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('[STRENGTH_DEBUG] First item sample:', JSON.stringify(response.data[0], null, 2));
      }
    } else {
      console.log('[STRENGTH_DEBUG] Response is direct data (no data property)');
      console.log('[STRENGTH_DEBUG] Response type:', Array.isArray(response) ? 'Array' : typeof response);
      console.log('[STRENGTH_DEBUG] Response length:', Array.isArray(response) ? response.length : 'N/A');
      
      if (Array.isArray(response) && response.length > 0) {
        console.log('[STRENGTH_DEBUG] First item sample:', JSON.stringify(response[0], null, 2));
      }
    }

    const strengthTypes = normalizeResponse<StrengthType[]>(response, 'Strength Types');
    
    // Log the categories found
    const categories = [...new Set(strengthTypes.map(type => type.Category))];
    console.log(`Found ${strengthTypes.length} strength types in categories: ${categories.join(', ')}`);
    
    return strengthTypes;
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
    // Get the user's unit ID from the strength slice or tanzeem slice
    const userUnitId = getState().strength.userUnitId;
    const userUnitDetails = getState().tanzeem.userUnitDetails;
    const unitId = userUnitId || (userUnitDetails?.id || null);
    
    // If we don't have the user's unit ID, return an empty array
    if (!unitId) {
      console.warn('No user unit ID available, cannot fetch strength records');
      return [];
    }
    
    console.log(`[STRENGTH_RECORDS_DEBUG] Fetching strength records for unit ID: ${unitId}`);
    
    const params = {
      filter: { Tanzeemi_Unit: { _eq: unitId } },
      sort: '-Reporting_Time', // Sort by most recent first
    };
    
    console.log(`[STRENGTH_RECORDS_DEBUG] Request params:`, JSON.stringify(params, null, 2));

    // The centralized API client handles token refresh automatically
    const response = await apiRequest<StrengthRecord[] | { data: StrengthRecord[] }>(() => ({
      path: '/items/Strength_Records',
      method: 'GET',
      params,
    }));
    
    console.log('[STRENGTH_RECORDS_DEBUG] ===================== API RESPONSE ================');
    console.log('[STRENGTH_RECORDS_DEBUG] Response structure:', Object.keys(response));
    
    // Check if response has data property
    if ('data' in response && response.data) {
      console.log('[STRENGTH_RECORDS_DEBUG] Response has data property');
      console.log('[STRENGTH_RECORDS_DEBUG] Response data type:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      console.log('[STRENGTH_RECORDS_DEBUG] Response data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('[STRENGTH_RECORDS_DEBUG] First record sample:', JSON.stringify(response.data[0], null, 2));
      }
    } else {
      console.log('[STRENGTH_RECORDS_DEBUG] Response is direct data (no data property)');
      console.log('[STRENGTH_RECORDS_DEBUG] Response type:', Array.isArray(response) ? 'Array' : typeof response);
      console.log('[STRENGTH_RECORDS_DEBUG] Response length:', Array.isArray(response) ? response.length : 'N/A');
      
      if (Array.isArray(response) && response.length > 0) {
        console.log('[STRENGTH_RECORDS_DEBUG] First record sample:', JSON.stringify(response[0], null, 2));
      }
    }

    const strengthRecords = normalizeResponse<StrengthRecord[]>(response, 'Strength Records');
    console.log(`[STRENGTH_RECORDS_DEBUG] Found ${strengthRecords.length} strength records for unit ID: ${unitId}`);
    
    // Log unique types in the records
    const uniqueTypes = [...new Set(strengthRecords.map(record => record.Type))];
    console.log(`[STRENGTH_RECORDS_DEBUG] Records contain ${uniqueTypes.length} unique types:`, uniqueTypes);
    
    return strengthRecords;
  } catch (error: any) {
    console.error('Error in fetchStrengthRecords:', error);
    return rejectWithValue(error.message || 'Failed to fetch strength records');
  }
});

export const createStrengthRecord = createAsyncThunk<
  StrengthRecord,
  Omit<StrengthRecord, 'id' | 'Tanzeemi_Unit'> & { Tanzeemi_Unit?: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/createStrengthRecord', async (recordData, { getState, dispatch, rejectWithValue }) => {
  try {
    // Get the user's unit ID from the strength slice or tanzeem slice
    const userUnitId = getState().strength.userUnitId;
    const userUnitDetails = getState().tanzeem.userUnitDetails;
    const unitId = recordData.Tanzeemi_Unit || userUnitId || (userUnitDetails?.id || null);
    
    // If we don't have the user's unit ID, reject the request
    if (!unitId) {
      return rejectWithValue('No user unit ID available, cannot create strength record');
    }
    
    // Create the record data with the user's unit ID
    const completeRecordData = {
      ...recordData,
      Tanzeemi_Unit: unitId,
      Reporting_Time: recordData.Reporting_Time || new Date().toISOString(),
    };
    
    console.log(`[CREATE_RECORD_DEBUG] Processing strength record for unit ID: ${unitId} and Type: ${recordData.Type}`);
    console.log(`[CREATE_RECORD_DEBUG] Record data:`, JSON.stringify(completeRecordData, null, 2));
    
    // First, check if a record already exists for this unit and type
    const existingRecords = getState().strength.strengthRecords;
    
    // Find the most recent record for this unit and type
    const existingRecord = existingRecords.find(record => 
      record.Tanzeemi_Unit === unitId && 
      record.Type === recordData.Type
    );
    
    let response;
    
    if (existingRecord) {
      // Update the existing record
      console.log(`[CREATE_RECORD_DEBUG] Found existing record with ID: ${existingRecord.id}, updating...`);
      
      // Prepare update data with explicit fields to prevent null values
      const recordToUpdate = {
        Value: recordData.Value,
        change_type: recordData.change_type,
        new_total: recordData.new_total,
        Reporting_Time: recordData.Reporting_Time || new Date().toISOString(),
        // Include these fields to ensure they're not nullified
        Tanzeemi_Unit: unitId,
        Type: recordData.Type
      };
      
      console.log(`[CREATE_RECORD_DEBUG] Update data:`, JSON.stringify(recordToUpdate, null, 2));
      
      response = await directApiRequest<StrengthRecord | { data: StrengthRecord }>(
        `/items/Strength_Records/${existingRecord.id}`,
        'PATCH',
        recordToUpdate
      ).catch(apiError => {
        console.error(`[CREATE_RECORD_DEBUG] API error during update:`, apiError);
        console.error(`[CREATE_RECORD_DEBUG] Error message:`, apiError.message);
        console.error(`[CREATE_RECORD_DEBUG] Error details:`, apiError.response?.data);
        throw apiError;
      });
      
      console.log('[CREATE_RECORD_DEBUG] ===================== UPDATE RESPONSE ================');
    } else {
      // Create a new record
      console.log(`[CREATE_RECORD_DEBUG] No existing record found, creating new record...`);
      
      // Ensure all required fields are explicitly set to prevent null values
      const recordToCreate = {
        Tanzeemi_Unit: unitId,
        Type: recordData.Type,
        Value: recordData.Value,
        change_type: recordData.change_type,
        new_total: recordData.new_total,
        Reporting_Time: recordData.Reporting_Time || new Date().toISOString()
      };
      
      console.log(`[CREATE_RECORD_DEBUG] Create data:`, JSON.stringify(recordToCreate, null, 2));
      
      response = await directApiRequest<StrengthRecord | { data: StrengthRecord }>(
        '/items/Strength_Records',
        'POST',
        recordToCreate
      ).catch(apiError => {
        console.error(`[CREATE_RECORD_DEBUG] API error during creation:`, apiError);
        console.error(`[CREATE_RECORD_DEBUG] Error message:`, apiError.message);
        console.error(`[CREATE_RECORD_DEBUG] Error details:`, apiError.response?.data);
        throw apiError;
      });
      
      console.log('[CREATE_RECORD_DEBUG] ===================== CREATE RESPONSE ================');
    }
    
    console.log('[CREATE_RECORD_DEBUG] Response structure:', Object.keys(response));
    console.log('[CREATE_RECORD_DEBUG] Response data:', JSON.stringify(response, null, 2));
    
    const resultRecord = normalizeResponse<StrengthRecord>(response, 'Strength Record');
    console.log(`[CREATE_RECORD_DEBUG] ${existingRecord ? 'Updated' : 'Created'} record with ID: ${resultRecord.id}`);
    console.log(`[CREATE_RECORD_DEBUG] Normalized record:`, JSON.stringify(resultRecord, null, 2));
    
    // Refresh records after creation/update
    dispatch(fetchStrengthRecords());
    
    return resultRecord;
  } catch (error: any) {
    console.error('Error in createStrengthRecord:', error);
    return rejectWithValue(error.message || 'Failed to create/update strength record');
  }
});

export const refreshStrengthData = createAsyncThunk<
  void,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/refreshStrengthData', async (_, { getState, dispatch }) => {
  console.log('[REFRESH_DEBUG] Starting strength data refresh');
  
  // Get the user's unit ID from the tanzeem slice
  const userUnitDetails = getState().tanzeem.userUnitDetails;
  const unitId = userUnitDetails?.id || null;
  
  console.log(`[REFRESH_DEBUG] User unit details:`, JSON.stringify(userUnitDetails, null, 2));
  console.log(`[REFRESH_DEBUG] Unit ID: ${unitId}`);
  
  // Set the user's unit ID in the strength slice
  if (unitId) {
    console.log(`[REFRESH_DEBUG] Setting user unit ID: ${unitId}`);
    dispatch(setUserUnitId(unitId));
  } else {
    console.log(`[REFRESH_DEBUG] No unit ID available, skipping setUserUnitId`);
  }
  
  // Fetch strength types and records
  console.log(`[REFRESH_DEBUG] Dispatching fetchStrengthTypes and fetchStrengthRecords`);
  
  try {
    const [typesResult, recordsResult] = await Promise.all([
      dispatch(fetchStrengthTypes()),
      dispatch(fetchStrengthRecords())
    ]);
    
    console.log(`[REFRESH_DEBUG] Fetch results:`);
    console.log(`[REFRESH_DEBUG] Types: ${typesResult.payload?.length || 0} items`);
    console.log(`[REFRESH_DEBUG] Records: ${recordsResult.payload?.length || 0} items`);
    
    console.log(`[REFRESH_DEBUG] Strength data refresh completed successfully`);
  } catch (error) {
    console.error(`[REFRESH_DEBUG] Error refreshing strength data:`, error);
  }
});

// Thunk to fetch strength record count and new_total aggregates for a given Type and userUnitHierarchyIds
export const fetchStrengthCountAndTotals = createAsyncThunk<
  { count: number, totals: Record<number, number>, sum: number, avg: number },
  { linkedToId: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchCountAndTotals', async ({ linkedToId }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const userUnitHierarchyIds = state.tanzeem?.userUnitHierarchyIds ?? [];
    if (!linkedToId || !userUnitHierarchyIds.length) {
      return { count: 0, totals: {}, sum: 0, avg: 0 };
    }
    const filter = `filter[Type][_eq]=${linkedToId}&filter[Tanzeemi_Unit][_in]=${userUnitHierarchyIds.join(',')}`;
    const url = `/items/Strength_Records?${filter}`;
    const response = await directApiRequest<{ data: any[] }>(url, 'GET');
    const records = response.data || [];
    const count = records.length;
    const totals: Record<number, number> = {};
    let sum = 0;
    records.forEach(record => {
      const unit = record.Tanzeemi_Unit;
      const newTotal = record.new_total;
      if (unit != null && typeof newTotal === 'number') {
        totals[unit] = newTotal; // latest new_total per unit (could be replaced with sum/avg logic)
        sum += newTotal;
      }
    });
    const avg = count > 0 ? sum / count : 0;
    return { count, totals, sum, avg };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch strength record count and totals');
  }
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
    setUserUnitId: (state, action: PayloadAction<number | null>) => {
      state.userUnitId = action.payload;
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
      
      // createStrengthRecord - no state changes needed as we refresh records after creation
      .addCase(createStrengthRecord.rejected, (state, action) => {
        state.recordsError = action.payload ?? 'Failed to create strength record';
      })
      
      // fetchStrengthCountAndTotals
      .addCase(fetchStrengthCountAndTotals.fulfilled, (state, action) => {
        state.strengthCount = action.payload.count;
        state.strengthTotals = action.payload.totals;
        state.strengthSum = action.payload.sum;
        state.strengthAvg = action.payload.avg;
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
export const selectUserUnitId = (state: RootState) => state.strength.userUnitId;
export const selectStrengthCount = (state: RootState) => state.strength.strengthCount;
export const selectStrengthTotals = (state: RootState) => state.strength.strengthTotals;
export const selectStrengthSum = (state: RootState) => state.strength.strengthSum;
export const selectStrengthAvg = (state: RootState) => state.strength.strengthAvg;

// Memoized selectors
export const selectStrengthByGender = createSelector(
  [selectStrengthTypes],
  (types) => {
    // First, group by gender
    const byGender = {
      male: types.filter(type => type.Gender === 'M'),
      female: types.filter(type => type.Gender === 'F'),
      other: types.filter(type => type.Gender === 'NA')
    };
    
    return byGender;
  }
);

// Selector to get strength types by category in the specified order
export const selectStrengthByCategory = createSelector(
  [selectStrengthTypes],
  (types) => {
    // Define the order of categories
    const categoryOrder = ['workforce', 'place', 'magazine'];
    
    // Group types by category
    const byCategory = categoryOrder.reduce((acc, category) => {
      acc[category] = types.filter(type => type.Category === category);
      return acc;
    }, {} as Record<string, StrengthType[]>);
    
    return byCategory;
  }
);

export const selectLatestStrengthRecordsByType = createSelector(
  [selectStrengthRecords, selectUserUnitId],
  (records, userUnitId) => {
    // Group records by Type and get the latest for each Type
    // Only include records for the user's unit if available
    const recordsByType = records.reduce((acc, record) => {
      // Skip records that don't match the user's unit ID if it's available
      if (userUnitId && record.Tanzeemi_Unit !== userUnitId) {
        return acc;
      }
      
      // Check if we already have a record for this type
      const existingRecord = acc[record.Type];
      
      // If no existing record, or this record is newer
      if (!existingRecord || 
          (record.Reporting_Time && existingRecord.Reporting_Time && 
           new Date(record.Reporting_Time).getTime() > new Date(existingRecord.Reporting_Time).getTime())) {
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
  [selectLatestStrengthRecordsByType, selectStrengthTypes],
  (recordsByType, types) => {
    // Calculate total strength value from the latest records
    // Only include types that are relevant to the user's unit level
    return Object.entries(recordsByType).reduce((total, [typeId, record]) => {
      // Check if this type is in the list of valid types
      const typeExists = types.some(type => type.id === Number(typeId));
      
      // Only include the record if the type exists in the types list
      return total + (typeExists ? record.new_total : 0);
    }, 0);
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

// Selector to get strength types by category and gender
export const selectStrengthByCategoryAndGender = createSelector(
  [selectStrengthTypes],
  (types) => {
    // Define the order of categories
    const categoryOrder = ['workforce', 'place', 'magazine'];
    
    // Create a nested structure: category -> gender -> types
    const result = categoryOrder.reduce((categoryAcc, category) => {
      // Filter types for this category
      const categoryTypes = types.filter(type => type.Category === category);
      
      // Group by gender within this category
      categoryAcc[category] = {
        male: categoryTypes.filter(type => type.Gender === 'M'),
        female: categoryTypes.filter(type => type.Gender === 'F'),
        other: categoryTypes.filter(type => type.Gender === 'NA')
      };
      
      return categoryAcc;
    }, {} as Record<string, Record<string, StrengthType[]>>);
    
    return result;
  }
);

// Exports
export const { clearStrengthTypes, clearStrengthRecords, setUserUnitId } = strengthSlice.actions;
export default strengthSlice.reducer;