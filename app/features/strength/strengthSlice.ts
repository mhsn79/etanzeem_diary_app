import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import { directApiRequest } from '../../services/apiClient';

// Types
export interface StrengthType {
  id: number;
  Name_Singular: string;
  Name_Plural: string;
  Gender: string; // "M", "F", "NA"
  Category: string; // "workforce", "place", "magazine"
  Reporting_Unit_Level: number;
  sort?: number | null; // Sort order for display
}

export interface StrengthRecord {
  id: number;
  Tanzeemi_Unit: number;
  Type: number; // Links to StrengthType.id
  plus_value: number; // Monthly increase (اضافہ)
  minus_value: number; // Monthly decrease (کمی)
  previous_total: number; // Total at start of month (carried forward)
  new_total: number; // = previous_total + plus_value - minus_value
  report_year: number;
  report_month: number;
  notes?: string; // Optional comments/notes
}

export interface StrengthState {
  strengthTypes: StrengthType[];
  strengthRecords: StrengthRecord[];
  carryForwardTotals: Record<number, number>; // typeId → latest new_total from previous months (for types without a current month record)
  loading: boolean;
  error: string | null;
  recordsLoading: boolean;
  recordsError: string | null;
  userUnitId: number | null; // Store the user's unit ID for reference
  currentYear: number; // Currently viewed year
  currentMonth: number; // Currently viewed month (1-12)
  strengthCount: number;
  strengthTotals: Record<number, number>;
  strengthSum: number;
  strengthAvg: number;
}

// Initial state
const now = new Date();
const initialState: StrengthState = {
  strengthTypes: [],
  strengthRecords: [],
  carryForwardTotals: {},
  loading: false,
  error: null,
  recordsLoading: false,
  recordsError: null,
  userUnitId: null,
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth() + 1,
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
    const state = getState();
    if (!state.auth.tokens?.accessToken) {
      return [];
    }

    // Get the currently active unit (selected unit takes priority over user's own unit)
    const userUnitDetails = state.tanzeem.userUnitDetails;
    const activeUnitId = state.strength.userUnitId || state.tanzeem.dashboardSelectedUnitId || userUnitDetails?.id;

    if (!activeUnitId) {
      console.warn('No unit available, cannot fetch strength types');
      return [];
    }

    // Look up the active unit from the tanzeem entity adapter to get its Level_id
    const activeUnit = state.tanzeem.entities[activeUnitId] as any;
    const unitLevelId = activeUnit?.Level_id || activeUnit?.level_id || userUnitDetails?.Level_id || userUnitDetails?.level_id;

    if (!unitLevelId) {
      console.warn('No unit level available, cannot fetch strength types');
      return [];
    }

    const filter = JSON.stringify({
      Reporting_Unit_Level: { _eq: unitLevelId },
    });

    const response = await directApiRequest<{ data: StrengthType[] }>(
      `/items/Strength_Type?filter=${encodeURIComponent(filter)}&sort=Category,id`,
      'GET'
    );

    const strengthTypes = response.data || [];
    return strengthTypes;
  } catch (error: any) {
    console.error('Error in fetchStrengthTypes:', error);
    return rejectWithValue(error.message || 'Failed to fetch strength types');
  }
});

export const fetchStrengthRecords = createAsyncThunk<
  StrengthRecord[],
  { year?: number; month?: number } | void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchStrengthRecords', async (params, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    if (!state.auth.tokens?.accessToken) {
      return [];
    }

    const userUnitId = state.strength.userUnitId;
    const userUnitDetails = state.tanzeem.userUnitDetails;
    const unitId = userUnitId || (userUnitDetails?.id || null);

    if (!unitId) {
      console.warn('No user unit ID available, cannot fetch strength records');
      return [];
    }

    const year = params?.year || state.strength.currentYear;
    const month = params?.month || state.strength.currentMonth;

    console.log(`[STRENGTH_RECORDS_DEBUG] Fetching strength records for unit ${unitId}, ${year}-${month}`);

    const filter = JSON.stringify({
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        { report_year: { _eq: year } },
        { report_month: { _eq: month } },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}`,
      'GET'
    );

    const strengthRecords = response.data || [];
    console.log(`[STRENGTH_RECORDS_DEBUG] Found ${strengthRecords.length} records for ${year}-${month}`);

    return strengthRecords;
  } catch (error: any) {
    console.error('Error in fetchStrengthRecords:', error);
    return rejectWithValue(error.message || 'Failed to fetch strength records');
  }
});

/**
 * Fetch the latest new_total for each strength type from previous months.
 * Used to display carry-forward values when no record exists for the selected month.
 */
export const fetchCarryForwardTotals = createAsyncThunk<
  Record<number, number>,
  { year: number; month: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchCarryForwardTotals', async ({ year, month }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    if (!state.auth.tokens?.accessToken) {
      return {};
    }

    const unitId = state.strength.userUnitId || state.tanzeem.userUnitDetails?.id;

    if (!unitId) return {};

    // Fetch the latest record per type before the selected month for this unit
    const filter = JSON.stringify({
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        {
          _or: [
            { report_year: { _lt: year } },
            {
              _and: [
                { report_year: { _eq: year } },
                { report_month: { _lt: month } },
              ],
            },
          ],
        },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}&sort=-report_year,-report_month&limit=-1`,
      'GET'
    );

    const records = response.data || [];
    // Group by Type, keep only the first (latest) record for each type
    const totals: Record<number, number> = {};
    for (const record of records) {
      if (!(record.Type in totals)) {
        totals[record.Type] = record.new_total;
      }
    }
    return totals;
  } catch (error: any) {
    console.error('[STRENGTH] Error fetching carry-forward totals:', error);
    return rejectWithValue(error.message || 'Failed to fetch carry-forward totals');
  }
});

// Helper to fetch the previous month's new_total for a given unit/type
async function fetchPreviousTotal(
  unitId: number,
  typeId: number,
  year: number,
  month: number
): Promise<number> {
  try {
    // Find the most recent record before (year, month) for this unit/type
    const filter = JSON.stringify({
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        { Type: { _eq: typeId } },
        {
          _or: [
            { report_year: { _lt: year } },
            {
              _and: [
                { report_year: { _eq: year } },
                { report_month: { _lt: month } },
              ],
            },
          ],
        },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}&sort=-report_year,-report_month&limit=1`,
      'GET'
    );

    if (response.data?.[0]) {
      return response.data[0].new_total;
    }
    return 0;
  } catch (error) {
    console.error('[STRENGTH] Error fetching previous total:', error);
    return 0;
  }
}

/**
 * Cascade updates to all subsequent months after a record is saved.
 * When a month's new_total changes, every later month's previous_total
 * (and therefore new_total) must be recalculated in chronological order.
 */
async function cascadeSubsequentMonths(
  unitId: number,
  typeId: number,
  savedYear: number,
  savedMonth: number,
  savedNewTotal: number
): Promise<void> {
  try {
    // Fetch all records for this (unit, type) AFTER the saved month, sorted chronologically
    const filter = JSON.stringify({
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        { Type: { _eq: typeId } },
        {
          _or: [
            { report_year: { _gt: savedYear } },
            {
              _and: [
                { report_year: { _eq: savedYear } },
                { report_month: { _gt: savedMonth } },
              ],
            },
          ],
        },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}&sort=report_year,report_month&limit=-1`,
      'GET'
    );

    const subsequentRecords = response.data || [];
    if (subsequentRecords.length === 0) return;

    console.log(`[STRENGTH_CASCADE] Updating ${subsequentRecords.length} subsequent records for unit=${unitId}, type=${typeId}`);

    let carryForward = savedNewTotal;

    for (const record of subsequentRecords) {
      const newPreviousTotal = carryForward;
      const newNewTotal = Math.max(0, newPreviousTotal + (record.plus_value || 0) - (record.minus_value || 0));

      // Only PATCH if values actually changed
      if (record.previous_total !== newPreviousTotal || record.new_total !== newNewTotal) {
        await directApiRequest(
          `/items/Strength_Records/${record.id}`,
          'PATCH',
          { previous_total: newPreviousTotal, new_total: newNewTotal }
        );
        console.log(`[STRENGTH_CASCADE] Updated record ${record.id} (${record.report_year}-${record.report_month}): prev=${newPreviousTotal}, total=${newNewTotal}`);
      }

      carryForward = newNewTotal;
    }
  } catch (error) {
    // Log but don't fail the main upsert — cascade is best-effort
    console.error('[STRENGTH_CASCADE] Error cascading subsequent months:', error);
  }
}

/**
 * Fetch fresh previous_total for a single type when the modal opens.
 * Returns the latest previous month's new_total for the given (unit, type, year, month).
 */
export const fetchPreviousTotalForType = createAsyncThunk<
  { typeId: number; previousTotal: number },
  { typeId: number; year: number; month: number },
  { state: RootState; rejectValue: string }
>('strength/fetchPreviousTotalForType', async ({ typeId, year, month }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const unitId = state.strength.userUnitId || state.tanzeem.userUnitDetails?.id;
    if (!unitId) return { typeId, previousTotal: 0 };
    const previousTotal = await fetchPreviousTotal(unitId, typeId, year, month);
    return { typeId, previousTotal };
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch previous total');
  }
});

export const upsertStrengthRecord = createAsyncThunk<
  StrengthRecord,
  {
    typeId: number;
    plus_value: number;
    minus_value: number;
    year: number;
    month: number;
    notes?: string;
    Tanzeemi_Unit?: number;
  },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/upsertStrengthRecord', async (params, { getState, dispatch, rejectWithValue }) => {
  try {
    const state = getState();
    const unitId = params.Tanzeemi_Unit || state.strength.userUnitId || state.tanzeem.userUnitDetails?.id;

    if (!unitId) {
      return rejectWithValue('No unit ID available, cannot save strength record');
    }

    console.log(`[STRENGTH_UPSERT] unit=${unitId}, type=${params.typeId}, ${params.year}-${params.month}, +${params.plus_value} -${params.minus_value}`);

    // Check for existing record for this (unit, type, year, month)
    const filter = JSON.stringify({
      _and: [
        { Tanzeemi_Unit: { _eq: unitId } },
        { Type: { _eq: params.typeId } },
        { report_year: { _eq: params.year } },
        { report_month: { _eq: params.month } },
      ],
    });

    const existingResponse = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}&limit=1`,
      'GET'
    );

    const existingRecord = existingResponse.data?.[0];

    // Always fetch fresh previous_total from the latest previous record
    // (don't rely on existing record's previous_total which may be stale)
    const previous_total = await fetchPreviousTotal(unitId, params.typeId, params.year, params.month);

    const new_total = Math.max(0, previous_total + params.plus_value - params.minus_value);

    const recordData: Record<string, any> = {
      Tanzeemi_Unit: unitId,
      Type: params.typeId,
      plus_value: params.plus_value,
      minus_value: params.minus_value,
      previous_total,
      new_total,
      report_year: params.year,
      report_month: params.month,
    };

    // Only include notes if provided (avoid overwriting existing notes with undefined)
    if (params.notes !== undefined) {
      recordData.notes = params.notes;
    }

    let response: { data: StrengthRecord } | StrengthRecord;

    if (existingRecord) {
      console.log(`[STRENGTH_UPSERT] Updating record ${existingRecord.id}`);
      response = await directApiRequest<{ data: StrengthRecord } | StrengthRecord>(
        `/items/Strength_Records/${existingRecord.id}`,
        'PATCH',
        recordData
      );
    } else {
      console.log(`[STRENGTH_UPSERT] Creating new record`);
      response = await directApiRequest<{ data: StrengthRecord } | StrengthRecord>(
        '/items/Strength_Records',
        'POST',
        recordData
      );
    }

    const resultRecord = normalizeResponse<StrengthRecord>(response, 'Strength Record');
    console.log(`[STRENGTH_UPSERT] Saved record ID=${resultRecord.id}, new_total=${resultRecord.new_total}`);

    // Cascade: update subsequent months' previous_total and new_total
    await cascadeSubsequentMonths(unitId, params.typeId, params.year, params.month, new_total);

    // Refresh records for the current month
    dispatch(fetchStrengthRecords({ year: params.year, month: params.month }));

    return resultRecord;
  } catch (error: any) {
    console.error('Error in upsertStrengthRecord:', error);
    return rejectWithValue(error.message || 'Failed to save strength record');
  }
});

export const refreshStrengthData = createAsyncThunk<
  void,
  { year?: number; month?: number } | void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/refreshStrengthData', async (params, { getState, dispatch }) => {
  const state = getState();
  // Use the already-set userUnitId (set by Workforce/screen to the selected unit)
  // Fall back to dashboard selected unit, then to user's own unit
  const userUnitDetails = state.tanzeem.userUnitDetails;
  const unitId = state.strength.userUnitId || state.tanzeem.dashboardSelectedUnitId || userUnitDetails?.id || null;

  if (unitId && state.strength.userUnitId !== unitId) {
    dispatch(setUserUnitId(unitId));
  }

  const year = params?.year || state.strength.currentYear;
  const month = params?.month || state.strength.currentMonth;

  console.log(`[STRENGTH_REFRESH] Refreshing for unit=${unitId}, ${year}-${month}`);

  try {
    const [typesResult, recordsResult] = await Promise.all([
      dispatch(fetchStrengthTypes()),
      dispatch(fetchStrengthRecords({ year, month })),
    ]);

    console.log(`[STRENGTH_REFRESH] Types: ${(typesResult.payload as any[])?.length || 0}, Records: ${(recordsResult.payload as any[])?.length || 0}`);

    // Fetch carry-forward totals from previous months (for types without a current month record)
    dispatch(fetchCarryForwardTotals({ year, month }));
  } catch (error) {
    console.error('[STRENGTH_REFRESH] Error:', error);
  }
});

// Thunk to fetch strength record aggregates for a given Type across hierarchy units for a month
export const fetchStrengthCountAndTotals = createAsyncThunk<
  { count: number; totals: Record<number, number>; sum: number; avg: number; plus_total: number; minus_total: number },
  { linkedToId: number; year?: number; month?: number },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('strength/fetchCountAndTotals', async ({ linkedToId, year, month }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const userUnitHierarchyIds = state.tanzeem?.userUnitHierarchyIds ?? [];
    if (!linkedToId || !userUnitHierarchyIds.length) {
      return { count: 0, totals: {}, sum: 0, avg: 0, plus_total: 0, minus_total: 0 };
    }

    const filterYear = year || state.strength.currentYear;
    const filterMonth = month || state.strength.currentMonth;

    const filter = JSON.stringify({
      _and: [
        { Type: { _eq: linkedToId } },
        { Tanzeemi_Unit: { _in: userUnitHierarchyIds } },
        { report_year: { _eq: filterYear } },
        { report_month: { _eq: filterMonth } },
      ],
    });

    const response = await directApiRequest<{ data: StrengthRecord[] }>(
      `/items/Strength_Records?filter=${encodeURIComponent(filter)}`,
      'GET'
    );

    const records = response.data || [];
    const count = records.length;
    const totals: Record<number, number> = {};
    let sum = 0;
    let plus_total = 0;
    let minus_total = 0;

    records.forEach((record) => {
      const unit = record.Tanzeemi_Unit;
      totals[unit] = record.new_total;
      sum += record.new_total;
      plus_total += record.plus_value || 0;
      minus_total += record.minus_value || 0;
    });

    const avg = count > 0 ? Math.round(sum / count) : 0;
    return { count, totals, sum, avg, plus_total, minus_total };
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
      state.carryForwardTotals = {};
      state.recordsLoading = false;
      state.recordsError = null;
    },
    setUserUnitId: (state, action: PayloadAction<number | null>) => {
      state.userUnitId = action.payload;
    },
    setCurrentPeriod: (state, action: PayloadAction<{ year: number; month: number }>) => {
      state.currentYear = action.payload.year;
      state.currentMonth = action.payload.month;
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
      
      // upsertStrengthRecord - no state changes needed as we refresh records after save
      .addCase(upsertStrengthRecord.rejected, (state, action) => {
        state.recordsError = action.payload ?? 'Failed to save strength record';
      })
      
      // fetchCarryForwardTotals
      .addCase(fetchCarryForwardTotals.fulfilled, (state, action) => {
        state.carryForwardTotals = action.payload;
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
export const selectCurrentYear = (state: RootState) => state.strength.currentYear;
export const selectCurrentMonth = (state: RootState) => state.strength.currentMonth;
export const selectCarryForwardTotals = (state: RootState) => state.strength.carryForwardTotals;

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
    
    // Group types by category and sort within each category
    const byCategory = categoryOrder.reduce((acc, category) => {
      const categoryTypes = types.filter(type => type.Category === category);
      
      // Sort by 'sort' field first, then by 'id'
      acc[category] = categoryTypes.sort((a, b) => {
        // Handle null/undefined sort values by treating them as 0
        const sortA = a.sort ?? 0;
        const sortB = b.sort ?? 0;
        
        if (sortA !== sortB) {
          return sortA - sortB;
        }
        
        // If sort values are equal, sort by id
        return a.id - b.id;
      });
      
      return acc;
    }, {} as Record<string, StrengthType[]>);
    
    return byCategory;
  }
);

// Records are already filtered by (unit, year, month) via the thunk,
// so this just indexes them by Type for O(1) lookup
export const selectCurrentMonthRecordsByType = createSelector(
  [selectStrengthRecords, selectUserUnitId],
  (records, userUnitId) => {
    const recordsByType: Record<number, StrengthRecord> = {};
    records.forEach((record) => {
      if (!userUnitId || record.Tanzeemi_Unit === userUnitId) {
        recordsByType[record.Type] = record;
      }
    });
    return recordsByType;
  }
);

// Backward-compatible alias
export const selectLatestStrengthRecordsByType = selectCurrentMonthRecordsByType;

export const selectStrengthValueByType = createSelector(
  [selectCurrentMonthRecordsByType, (_state: RootState, typeId: number) => typeId],
  (recordsByType, typeId) => {
    return recordsByType[typeId]?.new_total || 0;
  }
);

export const selectTotalStrengthValue = createSelector(
  [selectCurrentMonthRecordsByType, selectStrengthTypes],
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
    return records.reduce((total, record) => {
      return total + (record.plus_value || 0) - (record.minus_value || 0);
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
export const { clearStrengthTypes, clearStrengthRecords, setUserUnitId, setCurrentPeriod } = strengthSlice.actions;
export default strengthSlice.reducer;