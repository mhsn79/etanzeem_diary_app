import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import { directApiRequest } from '../../services/apiClient';
import { setUserUnitDetails } from '../tanzeem/tanzeemSlice';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────────────*/
export interface BaitulmalType {
  id: number;
  Name: string;
  Name_en?: string | null;
  main_category: 'income' | 'expense';
  Reporting_Unit_Level?: number | null;
  sort?: number | null;
  status?: string;
}

export interface BaitulmalRecord {
  id: number;
  status: string;
  Tanzeemi_Unit: number;
  Type: number; // FK to baitulmal_type
  amount: number;
  notes?: string | null;
  report_year: number;
  report_month: number;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
}

export interface CreateBaitulmalRecordPayload {
  Type: number;
  amount: number;
  notes?: string | null;
  report_month: number;
  report_year: number;
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────*/
const baitulmalAdapter = createEntityAdapter<BaitulmalRecord>({
  selectId: record => record.id,
  sortComparer: (a, b) => {
    // Sort by date_created descending (newest first)
    if (a.date_created && b.date_created) {
      return new Date(b.date_created).getTime() - new Date(a.date_created).getTime();
    }
    return b.id - a.id;
  },
});

interface BaitulmalExtraState {
  baitulmalTypes: BaitulmalType[];
  typesLoading: boolean;
  typesError: string | null;

  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  createStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createError: string | null;
  editStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  editError: string | null;
  deleteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  deleteError: string | null;

  lastFetchTime: number;
}

export type BaitulmalState = ReturnType<typeof baitulmalAdapter.getInitialState<BaitulmalExtraState>>;

const initialState: BaitulmalState = baitulmalAdapter.getInitialState<BaitulmalExtraState>({
  baitulmalTypes: [],
  typesLoading: false,
  typesError: null,

  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
  editStatus: 'idle',
  editError: null,
  deleteStatus: 'idle',
  deleteError: null,

  lastFetchTime: 0,
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunks
 * ────────────────────────────────────────────────────────────────────────────────*/

/** Fetch all baitulmal types (called once on app load) */
export const fetchBaitulmalTypes = createAsyncThunk<
  BaitulmalType[],
  void,
  { state: RootState; rejectValue: string }
>('baitulmal/fetchTypes', async (_, { rejectWithValue }) => {
  try {
    const response = await directApiRequest<{ data: BaitulmalType[] }>(
      '/items/baitulmal_type?fields=*&filter[status][_neq]=archived&sort=sort,id',
      'GET'
    );
    if (!response.data) throw new Error('Failed to fetch baitulmal types');
    return response.data;
  } catch (error: any) {
    console.warn('Fetch baitulmal types error:', error);
    const errorMsg = error?.message || '';
    if (errorMsg.includes('permission') || errorMsg.includes('FORBIDDEN')) return [];
    return rejectWithValue('ڈیٹا لوڈ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
  }
});

/** Fetch records for current unit hierarchy */
export const fetchBaitulmalRecords = createAsyncThunk<
  BaitulmalRecord[],
  void | { signal?: AbortSignal },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('baitulmal/fetchRecords', async (arg, { rejectWithValue, getState }) => {
  const signal = (typeof arg === 'object' && arg != null && 'signal' in arg) ? arg.signal : undefined;
  try {
    const state = getState();
    const userId = state.auth.user?.id;
    if (!userId) {
      return rejectWithValue('صارف کی تصدیق نہیں ہوئی۔ براہ کرم دوبارہ لاگ ان کریں۔');
    }

    const userUnitHierarchyIds = state.tanzeem?.userUnitHierarchyIds ?? [];
    const userUnitId = state.tanzeem?.userUnitDetails?.id;
    const unitIds: number[] = userUnitHierarchyIds.length > 0
      ? userUnitHierarchyIds
      : (userUnitId != null ? [userUnitId] : []);

    if (unitIds.length === 0) {
      return [];
    }

    // 30-second cache
    const currentRecords = state.baitulmal?.ids?.length || 0;
    const lastFetchTime = state.baitulmal?.lastFetchTime || 0;
    const now = Date.now();
    if (currentRecords > 0 && lastFetchTime > 0 && (now - lastFetchTime) < 30000) {
      return state.baitulmal?.entities
        ? Object.values(state.baitulmal.entities).filter(Boolean) as BaitulmalRecord[]
        : [];
    }

    const unitFilter = unitIds.length === 1
      ? `filter[Tanzeemi_Unit][_eq]=${unitIds[0]}`
      : `filter[Tanzeemi_Unit][_in]=${unitIds.join(',')}`;

    const endpoint = `/items/baitulmal_records?sort=-date_created&fields=*&filter[status][_neq]=archived&${unitFilter}`;

    const response = await directApiRequest<{ data: BaitulmalRecord[] }>(
      endpoint,
      'GET',
      undefined,
      signal
    );

    if (!response.data) throw new Error('Failed to fetch baitulmal records');
    return response.data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return rejectWithValue('aborted');
    }
    console.warn('Fetch baitulmal records error:', error);
    const errorMsg = error?.message || '';
    if (errorMsg.includes('permission') || errorMsg.includes('FORBIDDEN')) return [];
    return rejectWithValue('ڈیٹا لوڈ کرنے میں ناکامی۔ براہ کرم دوبارہ کوشش کریں۔');
  }
});

/** Create a new baitulmal record */
export const createBaitulmalRecord = createAsyncThunk<
  BaitulmalRecord,
  CreateBaitulmalRecordPayload,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('baitulmal/create', async (payload, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;
    if (!userId) {
      return rejectWithValue('صارف کی تصدیق نہیں ہوئی۔ براہ کرم دوبارہ لاگ ان کریں۔');
    }

    // Get unit ID from tanzeem state
    const userUnitId = state.tanzeem?.userUnitDetails?.id;
    if (!userUnitId) {
      return rejectWithValue('No unit context. Please try again.');
    }

    const completePayload = {
      ...payload,
      Tanzeemi_Unit: userUnitId,
    };

    const response = await directApiRequest<{ data: BaitulmalRecord }>(
      '/items/baitulmal_records',
      'POST',
      completePayload
    );

    if (!response.data) throw new Error('Failed to create baitulmal record');
    return response.data;
  } catch (error: any) {
    console.warn('Create baitulmal record error:', error);
    return rejectWithValue(error.message || 'Failed to create baitulmal record');
  }
});

/** Edit an existing baitulmal record */
export const editBaitulmalRecord = createAsyncThunk<
  BaitulmalRecord,
  { id: number; data: Partial<BaitulmalRecord> },
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('baitulmal/edit', async ({ id, data }, { rejectWithValue, getState, dispatch }) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;
    if (!userId) {
      return rejectWithValue('صارف کی تصدیق نہیں ہوئی۔ براہ کرم دوبارہ لاگ ان کریں۔');
    }

    // Verify ownership
    const fetchResponse = await directApiRequest<{ data: BaitulmalRecord }>(
      `/items/baitulmal_records/${id}`,
      'GET'
    );
    if (!fetchResponse.data) {
      throw new Error('Record not found');
    }
    if (String(fetchResponse.data.user_created) !== String(userId)) {
      return rejectWithValue('Unauthorized: You cannot edit this record');
    }

    const updateResponse = await directApiRequest<{ data: BaitulmalRecord }>(
      `/items/baitulmal_records/${id}`,
      'PATCH',
      data
    );

    if (!updateResponse.data) throw new Error('Failed to update baitulmal record');

    // Refresh records
    dispatch(fetchBaitulmalRecords());

    return updateResponse.data;
  } catch (error: any) {
    console.warn('Edit baitulmal record error:', error);
    return rejectWithValue(error.message || 'Failed to edit baitulmal record');
  }
});

/** Soft delete a baitulmal record */
export const deleteBaitulmalRecord = createAsyncThunk<
  number,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('baitulmal/delete', async (recordId, { rejectWithValue, getState, dispatch }) => {
  try {
    const state = getState();
    const userId = state.auth.user?.id;
    if (!userId) {
      return rejectWithValue('صارف کی تصدیق نہیں ہوئی۔ براہ کرم دوبارہ لاگ ان کریں۔');
    }

    await directApiRequest(
      `/items/baitulmal_records/${recordId}`,
      'PATCH',
      { status: 'archived' }
    );

    // Refresh records
    dispatch(fetchBaitulmalRecords());

    return recordId;
  } catch (error: any) {
    console.warn('Delete baitulmal record error:', error);
    return rejectWithValue(error.message || 'Failed to delete baitulmal record');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Slice
 * ────────────────────────────────────────────────────────────────────────────────*/
const baitulmalSlice = createSlice({
  name: 'baitulmal',
  initialState,
  reducers: {
    clearBaitulmalRecords(state) {
      baitulmalAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
      state.lastFetchTime = 0;
    },
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
    resetEditStatus(state) {
      state.editStatus = 'idle';
      state.editError = null;
    },
    resetDeleteStatus(state) {
      state.deleteStatus = 'idle';
      state.deleteError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch types
      .addCase(fetchBaitulmalTypes.pending, state => {
        state.typesLoading = true;
        state.typesError = null;
      })
      .addCase(fetchBaitulmalTypes.fulfilled, (state, action: PayloadAction<BaitulmalType[]>) => {
        state.typesLoading = false;
        state.baitulmalTypes = action.payload;
      })
      .addCase(fetchBaitulmalTypes.rejected, (state, action) => {
        state.typesLoading = false;
        state.typesError = action.payload ?? 'Failed to fetch baitulmal types';
      })

      // Fetch records
      .addCase(fetchBaitulmalRecords.pending, state => {
        if ((state.ids?.length ?? 0) === 0) {
          state.status = 'loading';
        }
        state.error = null;
      })
      .addCase(fetchBaitulmalRecords.fulfilled, (state, action: PayloadAction<BaitulmalRecord[]>) => {
        state.status = 'succeeded';
        state.lastFetchTime = Date.now();
        baitulmalAdapter.setAll(state, action.payload);
      })
      .addCase(fetchBaitulmalRecords.rejected, (state, action) => {
        if (action.payload === 'aborted') return;
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch baitulmal records';
      })

      // Create record
      .addCase(createBaitulmalRecord.pending, state => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(createBaitulmalRecord.fulfilled, (state, action: PayloadAction<BaitulmalRecord>) => {
        state.createStatus = 'succeeded';
        baitulmalAdapter.addOne(state, action.payload);
      })
      .addCase(createBaitulmalRecord.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload ?? 'Failed to create record';
      })

      // Edit record
      .addCase(editBaitulmalRecord.pending, state => {
        state.editStatus = 'loading';
        state.editError = null;
      })
      .addCase(editBaitulmalRecord.fulfilled, (state, action: PayloadAction<BaitulmalRecord>) => {
        state.editStatus = 'succeeded';
        baitulmalAdapter.upsertOne(state, action.payload);
      })
      .addCase(editBaitulmalRecord.rejected, (state, action) => {
        state.editStatus = 'failed';
        state.editError = action.payload ?? 'Failed to edit record';
      })

      // Delete record
      .addCase(deleteBaitulmalRecord.pending, state => {
        state.deleteStatus = 'loading';
        state.deleteError = null;
      })
      .addCase(deleteBaitulmalRecord.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded';
        baitulmalAdapter.removeOne(state, action.payload);
      })
      .addCase(deleteBaitulmalRecord.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        state.deleteError = action.payload ?? 'Failed to delete record';
      })

      // Clear records when user unit changes
      .addCase(setUserUnitDetails, (state) => {
        baitulmalAdapter.removeAll(state);
        state.status = 'idle';
        state.error = null;
        state.lastFetchTime = 0;
      });
  },
});

export const { clearBaitulmalRecords, resetCreateStatus, resetEditStatus, resetDeleteStatus } = baitulmalSlice.actions;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors
 * ────────────────────────────────────────────────────────────────────────────────*/
const selectBaitulmalState = (state: RootState): BaitulmalState =>
  (state as any).baitulmal ?? (initialState as BaitulmalState);

export const {
  selectAll: selectAllBaitulmalRecords,
  selectById: selectBaitulmalRecordById,
  selectIds: selectBaitulmalRecordIds,
  selectEntities: selectBaitulmalRecordEntities,
} = baitulmalAdapter.getSelectors(selectBaitulmalState);

// Types selectors
export const selectBaitulmalTypes = (state: RootState) => selectBaitulmalState(state).baitulmalTypes;
export const selectBaitulmalTypesLoading = (state: RootState) => selectBaitulmalState(state).typesLoading;

export const selectIncomeTypes = createSelector(
  [selectBaitulmalTypes],
  (types) => types.filter(t => t.main_category === 'income').sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999))
);

export const selectExpenseTypes = createSelector(
  [selectBaitulmalTypes],
  (types) => types.filter(t => t.main_category === 'expense').sort((a, b) => (a.sort ?? 999) - (b.sort ?? 999))
);

// Status selectors
export const selectBaitulmalStatus = (state: RootState) => selectBaitulmalState(state).status;
export const selectBaitulmalError = (state: RootState) => selectBaitulmalState(state).error;
export const selectBaitulmalCreateStatus = (state: RootState) => selectBaitulmalState(state).createStatus;
export const selectBaitulmalCreateError = (state: RootState) => selectBaitulmalState(state).createError;
export const selectBaitulmalEditStatus = (state: RootState) => selectBaitulmalState(state).editStatus;
export const selectBaitulmalEditError = (state: RootState) => selectBaitulmalState(state).editError;
export const selectBaitulmalDeleteStatus = (state: RootState) => selectBaitulmalState(state).deleteStatus;
export const selectBaitulmalDeleteError = (state: RootState) => selectBaitulmalState(state).deleteError;

// Records filtered by period
export const selectRecordsByPeriod = createSelector(
  [selectAllBaitulmalRecords, (_: RootState, month: number) => month, (_: RootState, _m: number, year: number) => year],
  (records, month, year) => records.filter(r => r.report_month === month && r.report_year === year && r.status !== 'archived')
);

// Income/Expense records by period (needs types to determine category)
export const selectIncomeRecordsByPeriod = createSelector(
  [selectAllBaitulmalRecords, selectBaitulmalTypes, (_: RootState, month: number) => month, (_: RootState, _m: number, year: number) => year],
  (records, types, month, year) => {
    const incomeTypeIds = new Set(types.filter(t => t.main_category === 'income').map(t => t.id));
    return records.filter(r => r.report_month === month && r.report_year === year && r.status !== 'archived' && incomeTypeIds.has(r.Type));
  }
);

export const selectExpenseRecordsByPeriod = createSelector(
  [selectAllBaitulmalRecords, selectBaitulmalTypes, (_: RootState, month: number) => month, (_: RootState, _m: number, year: number) => year],
  (records, types, month, year) => {
    const expenseTypeIds = new Set(types.filter(t => t.main_category === 'expense').map(t => t.id));
    return records.filter(r => r.report_month === month && r.report_year === year && r.status !== 'archived' && expenseTypeIds.has(r.Type));
  }
);

// Totals by period
export const selectIncomeTotalByPeriod = createSelector(
  [selectIncomeRecordsByPeriod],
  (records) => records.reduce((sum, r) => sum + (r.amount || 0), 0)
);

export const selectExpenseTotalByPeriod = createSelector(
  [selectExpenseRecordsByPeriod],
  (records) => records.reduce((sum, r) => sum + (r.amount || 0), 0)
);

// Get record by ID
export const getBaitulmalRecordById = (id: string | number) =>
  (state: RootState) => selectBaitulmalRecordEntities(state)[typeof id === 'string' ? parseInt(id) : id];

export default baitulmalSlice.reducer;
