import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  isTokenExpiredOrExpiring,
  refresh,
  checkAndRefreshTokenIfNeeded,
} from '../auth/authSlice';
import { TanzeemiUnit, TanzeemiUnitResponse, SingleTanzeemiUnitResponse } from '@/app/models/TanzeemiUnit';
import { normalizeTanzeemiUnitData, normalizeTanzeemiUnitDataArray } from '@/app/utils/apiNormalizer';
import { API_BASE_URL } from '@/app/constants/api';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────
 */
const tazeemAdapter = createEntityAdapter<TanzeemiUnit>({
  selectId: unit => unit.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

interface TazeemExtraState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  selectedUnitId: number | null;
  selectedUnitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedUnitError: string | null;
  userUnitDetails: TanzeemiUnit | null;
  userUnitStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  userUnitError: string | null;
  hierarchyStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  hierarchyError: string | null;
  unitsByLevel: Record<number, number[]>;
}

export type TazeemState = ReturnType<typeof tazeemAdapter.getInitialState<TazeemExtraState>>;

const initialState: TazeemState = tazeemAdapter.getInitialState<TazeemExtraState>({
  status: 'idle',
  error: null,
  selectedUnitId: null,
  selectedUnitStatus: 'idle',
  selectedUnitError: null,
  userUnitDetails: null,
  userUnitStatus: 'idle',
  userUnitError: null,
  hierarchyStatus: 'idle',
  hierarchyError: null,
  unitsByLevel: {},
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * API Helper Functions
 * ────────────────────────────────────────────────────────────────────────────────
 */

// Helper function to handle API requests with token
const apiRequest = async <T>(
  url: string,
  method: string,
  token: string,
  body?: any,
  dispatch?: AppDispatch,
  getState?: () => RootState
): Promise<T> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (!response.ok) {
    let errorText = '';
    try {
      const errorData = await response.json();
      errorText = JSON.stringify(errorData);
    } catch (e) {
      errorText = await response.text();
    }
    console.error('API Error:', errorText);
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data as T;
};

// Helper function to handle API requests with token refresh
const executeWithTokenRefresh = async <T>(
  apiCall: (token: string) => Promise<T>,
  token: string,
  dispatch: AppDispatch,
  getState: () => RootState
): Promise<T> => {
  try {
    return await apiCall(token);
  } catch (err: any) {
    const auth = selectAuthState(getState());
    const msg = String(err?.message ?? err);

    if (isTokenExpiredOrExpiring(auth.tokens?.expiresAt)) {
      const { tokens } = await dispatch(refresh()).unwrap();
      if (!tokens?.accessToken) throw new Error('Refresh failed');
      return await apiCall(tokens.accessToken);
    }
    throw new Error(msg);
  }
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch all tanzeemi units
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchTanzeemiUnits = createAsyncThunk<
  TanzeemiUnit[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tazeem/fetchAll', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching tanzeemi units...');

    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchUnits = async (accessToken: string) => {
      const response = await apiRequest<TanzeemiUnitResponse>(
        '/items/Tanzeemi_Unit?fields=*',
        'GET',
        accessToken
      );
      console.log('API Response for tanzeemi units:', response);
      if (!response.data) throw new Error('Failed to fetch tanzeemi units');
      
      // Transform the API response to match our expected format
      const transformedData = normalizeTanzeemiUnitDataArray(response.data);
      
      return transformedData;
    };

    return await executeWithTokenRefresh(fetchUnits, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch tanzeemi units error:', error);
    return rejectWithValue(error.message || 'Failed to fetch tanzeemi units');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch a single tanzeemi unit by ID
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchTanzeemiUnitById = createAsyncThunk<
  TanzeemiUnit,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tazeem/fetchById', async (unitId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching tanzeemi unit by ID:', unitId);
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchUnit = async (accessToken: string) => {
      const response = await apiRequest<SingleTanzeemiUnitResponse>(
        `/items/Tanzeemi_Unit/${unitId}?fields=*`,
        'GET',
        accessToken
      );
      
      console.log('API Response for tanzeemi unit:', response);
      if (!response.data) throw new Error(`Tanzeemi unit with ID ${unitId} not found`);
      
      // Transform the API response to match our expected format
      const transformedUnit = normalizeTanzeemiUnitData(response.data);
      return transformedUnit;
    };

    return await executeWithTokenRefresh(fetchUnit, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch tanzeemi unit error:', error);
    return rejectWithValue(error.message || `Failed to fetch tanzeemi unit with ID ${unitId}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch tanzeemi units by level
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchTanzeemiUnitsByLevel = createAsyncThunk<
  { units: TanzeemiUnit[], levelId: number },
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tazeem/fetchByLevel', async (levelId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching tanzeemi units by level ID:', levelId);
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchUnitsByLevel = async (accessToken: string) => {
      const response = await apiRequest<TanzeemiUnitResponse>(
        `/items/Tanzeemi_Unit?filter[Level_id][_eq]=${levelId}&fields=*`,
        'GET',
        accessToken
      );
      
      console.log(`API Response for tanzeemi units with level ID ${levelId}:`, response);
      if (!response.data) throw new Error(`Failed to fetch tanzeemi units with level ID ${levelId}`);
      
      // Transform the API response to match our expected format
      const transformedUnits = normalizeTanzeemiUnitDataArray(response.data);
      return { units: transformedUnits, levelId };
    };

    return await executeWithTokenRefresh(fetchUnitsByLevel, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch tanzeemi units by level error:', error);
    return rejectWithValue(error.message || `Failed to fetch tanzeemi units with level ID ${levelId}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch and organize the unit hierarchy
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchUnitHierarchy = createAsyncThunk<
  Record<number, TanzeemiUnit[]>,
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tazeem/fetchHierarchy', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching tanzeemi unit hierarchy');
    
    // First, fetch all units
    const units = await dispatch(fetchTanzeemiUnits()).unwrap();
    
    // Organize units by level
    const unitsByLevel: Record<number, TanzeemiUnit[]> = {};
    
    units.forEach(unit => {
      const levelId = unit.level_id || unit.Level_id;
      if (levelId !== undefined && levelId !== null) {
        if (!unitsByLevel[levelId]) {
          unitsByLevel[levelId] = [];
        }
        unitsByLevel[levelId].push(unit);
      }
    });
    
    return unitsByLevel;
  } catch (error: any) {
    console.error('Fetch unit hierarchy error:', error);
    return rejectWithValue(error.message || 'Failed to fetch unit hierarchy');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch user's tanzeemi unit
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchUserTanzeemiUnit = createAsyncThunk<
  TanzeemiUnit | null,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tazeem/fetchUserUnit', async (unitId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching user tanzeemi unit by ID:', unitId);
    
    if (!unitId) {
      console.log('No tanzeemi unit ID provided');
      return null;
    }
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchUnit = async (accessToken: string) => {
      const response = await apiRequest<SingleTanzeemiUnitResponse>(
        `/items/Tanzeemi_Unit/${unitId}?fields=*`,
        'GET',
        accessToken
      );
      
      console.log('API Response for user tanzeemi unit:', response);
      if (!response.data) {
        console.log(`Tanzeemi unit with ID ${unitId} not found`);
        return null;
      }
      
      // Transform the API response to match our expected format
      const transformedUnit = normalizeTanzeemiUnitData(response.data);
      return transformedUnit;
    };

    return await executeWithTokenRefresh(fetchUnit, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch user tanzeemi unit error:', error);
    return rejectWithValue(error.message || `Failed to fetch tanzeemi unit with ID ${unitId}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Slice
 * ────────────────────────────────────────────────────────────────────────────────
 */
const tazeemSlice = createSlice({
  name: 'tazeem',
  initialState,
  reducers: {
    clearTanzeemiUnits(state) {
      tazeemAdapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
    },
    setSelectedUnitId(state, action: PayloadAction<number | null>) {
      state.selectedUnitId = action.payload;
    },
    resetUserUnitStatus(state) {
      state.userUnitStatus = 'idle';
      state.userUnitError = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch all tanzeemi units
      .addCase(fetchTanzeemiUnits.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTanzeemiUnits.fulfilled, (state, action: PayloadAction<TanzeemiUnit[]>) => {
        state.status = 'succeeded';
        console.log('Setting tanzeemi units:', action.payload);
        tazeemAdapter.setAll(state, action.payload);
      })
      .addCase(fetchTanzeemiUnits.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch tanzeemi units';
      })
      
      // Fetch tanzeemi unit by ID
      .addCase(fetchTanzeemiUnitById.pending, state => {
        state.selectedUnitStatus = 'loading';
        state.selectedUnitError = null;
      })
      .addCase(fetchTanzeemiUnitById.fulfilled, (state, action: PayloadAction<TanzeemiUnit>) => {
        state.selectedUnitStatus = 'succeeded';
        state.selectedUnitId = action.payload.id;
        tazeemAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchTanzeemiUnitById.rejected, (state, action) => {
        state.selectedUnitStatus = 'failed';
        state.selectedUnitError = action.payload ?? 'Failed to fetch tanzeemi unit';
      })
      
      // Fetch tanzeemi units by level
      .addCase(fetchTanzeemiUnitsByLevel.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTanzeemiUnitsByLevel.fulfilled, (state, action: PayloadAction<{ units: TanzeemiUnit[], levelId: number }>) => {
        state.status = 'succeeded';
        console.log(`Setting tanzeemi units for level ${action.payload.levelId}:`, action.payload.units);
        
        // Add units to the entity adapter
        tazeemAdapter.upsertMany(state, action.payload.units);
        
        // Update the unitsByLevel mapping
        const unitIds = action.payload.units.map(unit => unit.id);
        state.unitsByLevel[action.payload.levelId] = unitIds;
      })
      .addCase(fetchTanzeemiUnitsByLevel.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch tanzeemi units by level';
      })
      
      // Fetch unit hierarchy
      .addCase(fetchUnitHierarchy.pending, state => {
        state.hierarchyStatus = 'loading';
        state.hierarchyError = null;
      })
      .addCase(fetchUnitHierarchy.fulfilled, (state, action: PayloadAction<Record<number, TanzeemiUnit[]>>) => {
        state.hierarchyStatus = 'succeeded';
        
        // Update the unitsByLevel mapping
        Object.entries(action.payload).forEach(([levelId, units]) => {
          const unitIds = units.map(unit => unit.id);
          state.unitsByLevel[Number(levelId)] = unitIds;
        });
      })
      .addCase(fetchUnitHierarchy.rejected, (state, action) => {
        state.hierarchyStatus = 'failed';
        state.hierarchyError = action.payload ?? 'Failed to fetch unit hierarchy';
      })
      
      // Fetch user's tanzeemi unit
      .addCase(fetchUserTanzeemiUnit.pending, state => {
        state.userUnitStatus = 'loading';
        state.userUnitError = null;
      })
      .addCase(fetchUserTanzeemiUnit.fulfilled, (state, action: PayloadAction<TanzeemiUnit | null>) => {
        state.userUnitStatus = 'succeeded';
        if (action.payload) {
          state.userUnitDetails = action.payload;
          // Also add to the entity adapter
          tazeemAdapter.upsertOne(state, action.payload);
        } else {
          state.userUnitDetails = null;
        }
      })
      .addCase(fetchUserTanzeemiUnit.rejected, (state, action) => {
        state.userUnitStatus = 'failed';
        state.userUnitError = action.payload ?? 'Failed to fetch user tanzeemi unit';
        state.userUnitDetails = null;
      });
  },
});

export const {
  clearTanzeemiUnits,
  setSelectedUnitId,
  resetUserUnitStatus,
} = tazeemSlice.actions;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors (with safe fallback)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const selectTazeemState = (state: RootState): TazeemState =>
  (state as any).tazeem ?? (initialState as TazeemState);

export const {
  selectAll: selectAllTanzeemiUnits,
  selectById: selectTanzeemiUnitById,
  selectIds: selectTanzeemiUnitIds,
  selectEntities: selectTanzeemiUnitEntities,
  selectTotal: selectTotalTanzeemiUnits,
} = tazeemAdapter.getSelectors(selectTazeemState);

export const selectTazeemStatus = (state: RootState) => selectTazeemState(state).status;
export const selectTazeemError = (state: RootState) => selectTazeemState(state).error;
export const selectSelectedUnitId = (state: RootState) => selectTazeemState(state).selectedUnitId;
export const selectSelectedUnit = (state: RootState) => {
  const unitId = selectSelectedUnitId(state);
  return unitId ? selectTanzeemiUnitById(state, unitId) : undefined;
};
export const selectSelectedUnitStatus = (state: RootState) => selectTazeemState(state).selectedUnitStatus;
export const selectSelectedUnitError = (state: RootState) => selectTazeemState(state).selectedUnitError;

// User unit selectors
export const selectUserUnitDetails = (state: RootState) => selectTazeemState(state).userUnitDetails;
export const selectUserUnitStatus = (state: RootState) => selectTazeemState(state).userUnitStatus;
export const selectUserUnitError = (state: RootState) => selectTazeemState(state).userUnitError;

// Hierarchy selectors
export const selectHierarchyStatus = (state: RootState) => selectTazeemState(state).hierarchyStatus;
export const selectHierarchyError = (state: RootState) => selectTazeemState(state).hierarchyError;
export const selectUnitsByLevel = (state: RootState) => selectTazeemState(state).unitsByLevel;

// Helper selector to get units for a specific level
export const selectUnitsByLevelId = (state: RootState, levelId: number) => {
  const unitIds = selectTazeemState(state).unitsByLevel[levelId] || [];
  return unitIds.map(id => selectTanzeemiUnitById(state, id)).filter(Boolean) as TanzeemiUnit[];
};

// Helper selector to get parent unit of a specific unit
export const selectParentUnit = (state: RootState, unitId: number) => {
  const unit = selectTanzeemiUnitById(state, unitId);
  if (!unit) return undefined;
  
  const parentId = unit.parent_id || unit.Parent_id;
  if (parentId === undefined || parentId === null) return undefined;
  
  return selectTanzeemiUnitById(state, parentId);
};

// Helper selector to get child units of a specific unit
export const selectChildUnits = (state: RootState, unitId: number) => {
  const allUnits = selectAllTanzeemiUnits(state);
  return allUnits.filter(unit => {
    const parentId = unit.parent_id || unit.Parent_id;
    return parentId === unitId;
  });
};

export default tazeemSlice.reducer;