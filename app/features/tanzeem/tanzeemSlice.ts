import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  isTokenExpiredOrExpiring,
  refresh,
  checkAndRefreshTokenIfNeeded,
} from '../auth/authSlice';
import { fetchNazimDetails } from '../persons/personSlice';
import { TanzeemiUnit, TanzeemiUnitResponse, SingleTanzeemiUnitResponse } from '@/app/models/TanzeemiUnit';
import { normalizeTanzeemiUnitData, normalizeTanzeemiUnitDataArray } from '@/app/utils/apiNormalizer';
import { API_BASE_URL } from '@/app/constants/api';

// Define the TanzeemLevel interface
export interface TanzeemLevel {
  id: number;
  Name: string;
  Nazim_Label: string;
  status?: string;
  sort?: number | null;
  user_created?: string;
  date_created?: string;
  user_updated?: string | null;
  date_updated?: string | null;
  [key: string]: any;
}

export interface TanzeemLevelResponse {
  data: TanzeemLevel;
}

export interface TanzeemLevelsResponse {
  data: TanzeemLevel[];
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Entity adapter + initial state
 * ────────────────────────────────────────────────────────────────────────────────
 */
const tanzeemAdapter = createEntityAdapter<TanzeemiUnit>({
  selectId: unit => unit.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

interface TanzeemExtraState {
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
  userUnitHierarchyIds: number[]; // Store all hierarchy IDs for the user's unit
  userTanzeemiLevelDetails: TanzeemLevel | null;
  userTanzeemiLevelStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  userTanzeemiLevelError: string | null;
}

export type TanzeemState = ReturnType<typeof tanzeemAdapter.getInitialState<TanzeemExtraState>>;

const initialState: TanzeemState = tanzeemAdapter.getInitialState<TanzeemExtraState>({
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
  userUnitHierarchyIds: [],
  userTanzeemiLevelDetails: null,
  userTanzeemiLevelStatus: 'idle',
  userTanzeemiLevelError: null,
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
>('tanzeem/fetchAll', async (_, { getState, dispatch, rejectWithValue }) => {
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
>('tanzeem/fetchById', async (unitId, { getState, dispatch, rejectWithValue }) => {
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
      
      // If the unit has a Nazim_id, fetch the Nazim details
      if (transformedUnit.Nazim_id) {
        console.log(`Unit has Nazim_id: ${transformedUnit.Nazim_id}, fetching Nazim details...`);
        dispatch(fetchNazimDetails(transformedUnit.Nazim_id));
      }
      
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
>('tanzeem/fetchByLevel', async (levelId, { getState, dispatch, rejectWithValue }) => {
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
>('tanzeem/fetchHierarchy', async (_, { getState, dispatch, rejectWithValue }) => {
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
/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Helper function to fetch a Tanzeemi unit and process its zaili_unit_hierarchy
 * ────────────────────────────────────────────────────────────────────────────────
 */
const fetchAndProcessHierarchy = async (
  unitId: number,
  token: string,
  dispatch: AppDispatch,
  getState: () => RootState,
  processedIds: Set<number> = new Set(),
  allHierarchyIds: number[] = [],
  allUnits: TanzeemiUnit[] = []
): Promise<{ unit: TanzeemiUnit | null, allIds: number[], hierarchyUnits: TanzeemiUnit[] }> => {
  // Avoid processing the same ID multiple times (prevents infinite loops)
  if (processedIds.has(unitId)) {
    return { unit: null, allIds: allHierarchyIds, hierarchyUnits: allUnits };
  }
  
  processedIds.add(unitId);
  
  try {
    const fetchUnit = async (accessToken: string) => {
      const response = await apiRequest<SingleTanzeemiUnitResponse>(
        `/items/Tanzeemi_Unit/${unitId}?fields=*`,
        'GET',
        accessToken
      );
      
      if (!response.data) {
        console.log(`Tanzeemi unit with ID ${unitId} not found`);
        return null;
      }
      
      // Transform the API response to match our expected format
      return normalizeTanzeemiUnitData(response.data);
    };

    const unit = await executeWithTokenRefresh(fetchUnit, token, dispatch, getState);
    
    if (!unit) {
      return { unit: null, allIds: allHierarchyIds, hierarchyUnits: allUnits };
    }
    
    // Add the current unit to our collection of all units
    allUnits.push(unit);
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (unit.Nazim_id) {
      console.log(`Unit ${unitId} has Nazim_id: ${unit.Nazim_id}, fetching Nazim details...`);
      dispatch(fetchNazimDetails(unit.Nazim_id));
    }
    
    // Process zaili_unit_hierarchy if it exists and is an array
    if (unit.zaili_unit_hierarchy && Array.isArray(unit.zaili_unit_hierarchy)) {
      console.log(`Processing zaili_unit_hierarchy for unit ${unitId}:`, unit.zaili_unit_hierarchy);
      
      // Add all hierarchy IDs to our tracking array
      const hierarchyIds = unit.zaili_unit_hierarchy as number[];
      allHierarchyIds.push(...hierarchyIds);
      
      // Recursively fetch each unit in the hierarchy
      for (const childId of hierarchyIds) {
        if (typeof childId === 'number' && !processedIds.has(childId)) {
          const result = await fetchAndProcessHierarchy(
            childId, 
            token, 
            dispatch, 
            getState, 
            processedIds,
            allHierarchyIds,
            allUnits
          );
          
          // Merge any new IDs found in nested hierarchies
          allHierarchyIds.push(...result.allIds.filter(id => !allHierarchyIds.includes(id)));
        }
      }
    }
    
    return { unit, allIds: allHierarchyIds, hierarchyUnits: allUnits };
  } catch (error) {
    console.error(`Error fetching unit ${unitId} in hierarchy:`, error);
    return { unit: null, allIds: allHierarchyIds, hierarchyUnits: allUnits };
  }
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch a tanzeem level by ID
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchTanzeemLevelById = createAsyncThunk<
  TanzeemLevel,
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tanzeem/fetchLevelById', async (levelId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching tanzeem level by ID:', levelId);
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchLevel = async (accessToken: string) => {
      const response = await apiRequest<TanzeemLevelResponse>(
        `/items/Tanzeemi_Level/${levelId}?fields=*`,
        'GET',
        accessToken
      );
      
      console.log('API Response for tanzeem level:', response);
      if (!response.data) throw new Error(`Tanzeem level with ID ${levelId} not found`);
      
      return response.data;
    };

    return await executeWithTokenRefresh(fetchLevel, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch tanzeem level error:', error);
    return rejectWithValue(error.message || `Failed to fetch tanzeem level with ID ${levelId}`);
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch all tanzeem levels
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchAllTanzeemLevels = createAsyncThunk<
  TanzeemLevel[],
  void,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tanzeem/fetchAllLevels', async (_, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching all tanzeem levels');
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    const fetchLevels = async (accessToken: string) => {
      const response = await apiRequest<TanzeemLevelsResponse>(
        '/items/Tanzeemi_Level?fields=*',
        'GET',
        accessToken
      );
      
      console.log('API Response for all tanzeem levels:', response);
      if (!response.data) throw new Error('Failed to fetch tanzeem levels');
      
      return response.data;
    };

    return await executeWithTokenRefresh(fetchLevels, token, dispatch, getState);
  } catch (error: any) {
    console.error('Fetch all tanzeem levels error:', error);
    return rejectWithValue(error.message || 'Failed to fetch tanzeem levels');
  }
});

export const fetchUserTanzeemiUnit = createAsyncThunk<
  { unit: TanzeemiUnit | null, hierarchyIds: number[], hierarchyUnits: TanzeemiUnit[] },
  number,
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tanzeem/fetchUserUnit', async (unitId, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching user tanzeemi unit by ID:', unitId);
    
    if (!unitId) {
      console.log('No tanzeemi unit ID provided');
      return { unit: null, hierarchyIds: [], hierarchyUnits: [] };
    }
    
    // Refresh token if needed
    await dispatch(checkAndRefreshTokenIfNeeded());

    const auth = selectAuthState(getState());
    let token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    // Fetch the unit and process its hierarchy
    const { unit, allIds, hierarchyUnits } = await fetchAndProcessHierarchy(unitId, token, dispatch, getState);
    console.log('unit------------------->>', unit);
    
    // Remove duplicates from the hierarchy IDs
    const uniqueHierarchyIds = [...new Set([...allIds, unitId])];
    console.log(`Completed hierarchy processing for unit ${unitId}. Found ${uniqueHierarchyIds.length} unique hierarchy IDs:`, uniqueHierarchyIds);
    console.log(`Collected ${hierarchyUnits.length} units in the hierarchy tree`);
    console.log(hierarchyUnits);
    
    // Add all units to the store at once
    dispatch(addMultipleTanzeemiUnits(hierarchyUnits));
    
    // If the unit has a level_id, fetch the level details
    if (unit && (unit.Level_id || unit.level_id)) {
      const levelId = unit.Level_id || unit.level_id;
      if (typeof levelId === 'number') {
        // Dispatch the action to fetch the tanzeem level
        dispatch(fetchTanzeemLevelById(levelId));
      }
    }
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (unit && unit.Nazim_id) {
      console.log(`User unit has Nazim_id: ${unit.Nazim_id}, fetching Nazim details...`);
      dispatch(fetchNazimDetails(unit.Nazim_id));
    }
    
    return { unit, hierarchyIds: uniqueHierarchyIds, hierarchyUnits };
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
const tanzeemSlice = createSlice({
  name: 'tanzeem',
  initialState,
  reducers: {
    clearTanzeemiUnits(state) {
      tanzeemAdapter.removeAll(state);
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
    addTanzeemiUnit(state, action: PayloadAction<TanzeemiUnit>) {
      tanzeemAdapter.upsertOne(state, action.payload);
    },
    addMultipleTanzeemiUnits(state, action: PayloadAction<TanzeemiUnit[]>) {
      tanzeemAdapter.upsertMany(state, action.payload);
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
        tanzeemAdapter.setAll(state, action.payload);
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
        tanzeemAdapter.upsertOne(state, action.payload);
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
        tanzeemAdapter.upsertMany(state, action.payload.units);
        
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
      .addCase(fetchUserTanzeemiUnit.fulfilled, (state, action: PayloadAction<{ unit: TanzeemiUnit | null, hierarchyIds: number[], hierarchyUnits: TanzeemiUnit[] }>) => {
        state.userUnitStatus = 'succeeded';
        
        // Store the hierarchy IDs
        state.userUnitHierarchyIds = action.payload.hierarchyIds;
        
        if (action.payload.unit) {
          state.userUnitDetails = action.payload.unit;
          // Units are added to the store in the fetchUserTanzeemiUnit function
        } else {
          state.userUnitDetails = null;
        }
      })
      .addCase(fetchUserTanzeemiUnit.rejected, (state, action) => {
        state.userUnitStatus = 'failed';
        state.userUnitError = action.payload ?? 'Failed to fetch user tanzeemi unit';
        state.userUnitDetails = null;
        state.userUnitHierarchyIds = [];
      })
      
      // Fetch tanzeem level by ID
      .addCase(fetchTanzeemLevelById.pending, (state) => {
        state.userTanzeemiLevelStatus = 'loading';
        state.userTanzeemiLevelError = null;
      })
      .addCase(fetchTanzeemLevelById.fulfilled, (state, action: PayloadAction<TanzeemLevel>) => {
        state.userTanzeemiLevelStatus = 'succeeded';
        state.userTanzeemiLevelDetails = action.payload;
      })
      .addCase(fetchTanzeemLevelById.rejected, (state, action) => {
        state.userTanzeemiLevelStatus = 'failed';
        state.userTanzeemiLevelError = action.payload ?? 'Failed to fetch tanzeem level';
        state.userTanzeemiLevelDetails = null;
      });
  },
});

export const {
  clearTanzeemiUnits,
  setSelectedUnitId,
  resetUserUnitStatus,
  addTanzeemiUnit,
  addMultipleTanzeemiUnits,
} = tanzeemSlice.actions;

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors (with safe fallback)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const selectTanzeemState = (state: RootState): TanzeemState =>
  (state as any).tanzeem ?? (initialState as TanzeemState);

export const {
  selectAll: selectAllTanzeemiUnits,
  selectById: selectTanzeemiUnitById,
  selectIds: selectTanzeemiUnitIds,
  selectEntities: selectTanzeemiUnitEntities,
  selectTotal: selectTotalTanzeemiUnits,
} = tanzeemAdapter.getSelectors(selectTanzeemState);

export const selectTanzeemStatus = (state: RootState) => selectTanzeemState(state).status;
export const selectTanzeemError = (state: RootState) => selectTanzeemState(state).error;
export const selectSelectedUnitId = (state: RootState) => selectTanzeemState(state).selectedUnitId;
export const selectSelectedUnit = (state: RootState) => {
  const unitId = selectSelectedUnitId(state);
  return unitId ? selectTanzeemiUnitById(state, unitId) : undefined;
};
export const selectSelectedUnitStatus = (state: RootState) => selectTanzeemState(state).selectedUnitStatus;
export const selectSelectedUnitError = (state: RootState) => selectTanzeemState(state).selectedUnitError;

// User unit selectors
export const selectUserUnitDetails = (state: RootState) => selectTanzeemState(state).userUnitDetails;
export const selectUserUnitStatus = (state: RootState) => selectTanzeemState(state).userUnitStatus;
export const selectUserUnitError = (state: RootState) => selectTanzeemState(state).userUnitError;
export const selectUserUnitHierarchyIds = (state: RootState) => selectTanzeemState(state).userUnitHierarchyIds;

// User level selectors
export const selectUserTanzeemiLevelDetails = (state: RootState) => selectTanzeemState(state).userTanzeemiLevelDetails;
export const selectUserTanzeemiLevelStatus = (state: RootState) => selectTanzeemState(state).userTanzeemiLevelStatus;
export const selectUserTanzeemiLevelError = (state: RootState) => selectTanzeemState(state).userTanzeemiLevelError;

// Helper selector to get all units in the user's hierarchy
export const selectUserHierarchyUnits = (state: RootState) => {
  const hierarchyIds = selectUserUnitHierarchyIds(state);
  return hierarchyIds.map(id => selectTanzeemiUnitById(state, id)).filter(Boolean) as TanzeemiUnit[];
};

// Helper selector to get all units in the hierarchy as a flat array
export const selectAllHierarchyUnits = (state: RootState) => {
  const userUnit = selectUserUnitDetails(state);
  const hierarchyUnits = selectUserHierarchyUnits(state);
  
  // Combine user unit with hierarchy units if it exists
  return userUnit 
    ? [userUnit, ...hierarchyUnits.filter(unit => unit.id !== userUnit.id)] 
    : hierarchyUnits;
};

// Hierarchy selectors
export const selectHierarchyStatus = (state: RootState) => selectTanzeemState(state).hierarchyStatus;
export const selectHierarchyError = (state: RootState) => selectTanzeemState(state).hierarchyError;
export const selectUnitsByLevel = (state: RootState) => selectTanzeemState(state).unitsByLevel;

// Helper selector to get units for a specific level
export const selectUnitsByLevelId = (state: RootState, levelId: number) => {
  const unitIds = selectTanzeemState(state).unitsByLevel[levelId] || [];
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

export default tanzeemSlice.reducer;