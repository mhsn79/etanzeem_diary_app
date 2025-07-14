import { createSlice, createAsyncThunk, PayloadAction, createEntityAdapter, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import { fetchNazimDetails } from '../persons/personSlice';
import { TanzeemiUnit, TanzeemiUnitResponse, SingleTanzeemiUnitResponse } from '@/app/models/TanzeemiUnit';
import { normalizeTanzeemiUnitData, normalizeTanzeemiUnitDataArray } from '@/app/utils/apiNormalizer';

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
  // Store levels by their ID to support multiple levels
  levelsById: Record<number, TanzeemLevel>;
  // Dashboard selected unit (can only be userUnit or its children)
  dashboardSelectedUnitId: number | null;
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
  levelsById: {},
  dashboardSelectedUnitId: null,
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * API Helper Functions
 * ────────────────────────────────────────────────────────────────────────────────
 */

// Import the centralized API client
import apiClient, { directApiRequest } from '../../services/apiClient';

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

    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<TanzeemiUnitResponse>(
      '/items/Tanzeemi_Unit?fields=*',
      'GET'
    );
    
    if (!response.data) throw new Error('Failed to fetch tanzeemi units');
    
    // Transform the API response to match our expected format
    const transformedData = normalizeTanzeemiUnitDataArray(response.data);
    
    return transformedData;
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
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<SingleTanzeemiUnitResponse>(
      `/items/Tanzeemi_Unit/${unitId}?fields=*`,
      'GET'
    );
    
    console.log('API Response for tanzeemi unit:', response);
    if (!response.data) throw new Error(`Tanzeemi unit with ID ${unitId} not found`);
    
    // Transform the API response to match our expected format
    const transformedUnit = normalizeTanzeemiUnitData(response.data);
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (transformedUnit.Nazim_id) {
      console.log(`Unit has Nazim_id: ${transformedUnit.Nazim_id}, fetching Nazim details...`);
      // dispatch(fetchNazimDetails(transformedUnit.Nazim_id));
    }
    
    return transformedUnit;
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
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<TanzeemiUnitResponse>(
      `/items/Tanzeemi_Unit?filter[Level_id][_eq]=${levelId}&fields=*`,
      'GET'
    );
    
    console.log(`API Response for tanzeemi units with level ID ${levelId}:`, response);
    if (!response.data) throw new Error(`Failed to fetch tanzeemi units with level ID ${levelId}`);
    
    // Transform the API response to match our expected format
    const transformedUnits = normalizeTanzeemiUnitDataArray(response.data);
    return { units: transformedUnits, levelId };
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
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<SingleTanzeemiUnitResponse>(
      `/items/Tanzeemi_Unit/${unitId}?fields=*`,
      'GET'
    );
    
    if (!response.data) {
      console.log(`Tanzeemi unit with ID ${unitId} not found`);
      return { unit: null, allIds: allHierarchyIds, hierarchyUnits: allUnits };
    }
    
    // Transform the API response to match our expected format
    const unit = normalizeTanzeemiUnitData(response.data);
    
    // Add the current unit to our collection of all units
    allUnits.push(unit);
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (unit.Nazim_id) {
      console.log(`Unit ${unitId} has Nazim_id: ${unit.Nazim_id}, fetching Nazim details...`);
      // dispatch(fetchNazimDetails(unit.Nazim_id));
    }
    
    // Fetch parent unit if it exists
    const parentId = unit.parent_id || unit.Parent_id;
    if (parentId && typeof parentId === 'number' && !processedIds.has(parentId)) {
      console.log(`Fetching parent unit with ID: ${parentId}`);
      try {
        const parentResponse = await directApiRequest<SingleTanzeemiUnitResponse>(
          `/items/Tanzeemi_Unit/${parentId}?fields=*`,
          'GET'
        );
        
        if (parentResponse.data) {
          const parentUnit = normalizeTanzeemiUnitData(parentResponse.data);
          allUnits.push(parentUnit);
          allHierarchyIds.push(parentId);
          console.log(`Successfully fetched parent unit: ${parentUnit.Name}`);
          
          // If the parent unit has a level_id, fetch the level details
          if (parentUnit.Level_id || parentUnit.level_id) {
            const parentLevelId = parentUnit.Level_id || parentUnit.level_id;
            if (typeof parentLevelId === 'number') {
              console.log(`Fetching level details for parent unit: ${parentLevelId}`);
              dispatch(fetchTanzeemLevelById(parentLevelId));
            }
          }
        }
      } catch (parentError) {
        console.error(`Error fetching parent unit ${parentId}:`, parentError);
      }
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
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<TanzeemLevelResponse>(
      `/items/Tanzeemi_Level/${levelId}?fields=*`,
      'GET'
    );
    
    if (!response.data) throw new Error(`Tanzeem level with ID ${levelId} not found`);
    
    return response.data;
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
    
    // Use directApiRequest which uses fetch directly for more reliable results
    const response = await directApiRequest<TanzeemLevelsResponse>(
      '/items/Tanzeemi_Level?fields=*',
      'GET'
    );
    
    console.log('API Response for all tanzeem levels:', response);
    if (!response.data) throw new Error('Failed to fetch tanzeem levels');
    
    return response.data;
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
    
    // Fetch the unit and process its hierarchy using the centralized API client
    const { unit, allIds, hierarchyUnits } = await fetchAndProcessHierarchy(unitId, dispatch, getState);
    console.log('unit------------------->>', unit);
    console.log('==================this hierarchyUnits which are under mine==============>>>',hierarchyUnits.length);
    
    // Remove duplicates from the hierarchy IDs
    const uniqueHierarchyIds = [...new Set([...allIds, unitId])];
    console.log(`Completed hierarchy processing for unit ${unitId}. Found ${uniqueHierarchyIds.length} unique hierarchy IDs:`, uniqueHierarchyIds);
    console.log(`Collected ${hierarchyUnits.length} units in the hierarchy tree`);
    
    // Add all units to the store at once
    dispatch(addMultipleTanzeemiUnits(hierarchyUnits));
    
    // Person data is already available from the login process via Nazim_id
    // No need to fetch person by email since we follow the correct flow
    console.log('✅ Person data already available from login process');
    
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
      // dispatch(fetchNazimDetails(unit.Nazim_id));
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
    setUserUnitDetails(state, action: PayloadAction<TanzeemiUnit | null>) {
      state.userUnitDetails = action.payload;
    },
    setDashboardSelectedUnit(state, action: PayloadAction<number | null>) {
      const selectedUnitId = action.payload;
      
      // If no selection, reset to user unit
      if (!selectedUnitId) {
        state.dashboardSelectedUnitId = state.userUnitDetails?.id || null;
        return;
      }
      
      // Validate that selected unit is either user unit or its child
      const userUnitId = state.userUnitDetails?.id;
      if (!userUnitId) {
        state.dashboardSelectedUnitId = null;
        return;
      }
      
      // Check if selected unit is the user unit itself (allowed)
      if (selectedUnitId === userUnitId) {
        state.dashboardSelectedUnitId = selectedUnitId;
        return;
      }
      
      // Check if selected unit is a child of user unit (allowed)
      const allUnits = tanzeemAdapter.getSelectors().selectAll(state);
      const selectedUnit = allUnits.find(unit => unit.id === selectedUnitId);
      
      if (selectedUnit && selectedUnit.Parent_id === userUnitId) {
        state.dashboardSelectedUnitId = selectedUnitId;
      } else {
        // Invalid selection (parent or sibling), reset to user unit
        console.warn('Invalid unit selection (parent/sibling), resetting to user unit');
        state.dashboardSelectedUnitId = userUnitId;
      }
    }
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
        // console.log('Setting tanzeemi units:', action.payload);
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
        // Also store the level by its ID for multiple level support
        state.levelsById[action.payload.id] = action.payload;
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
  setUserUnitDetails,
  setDashboardSelectedUnit,
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
export const selectSelectedUnit = createSelector(
  [selectSelectedUnitId, state => state],
  (unitId, state) => {
    return unitId ? selectTanzeemiUnitById(state, unitId) : undefined;
  }
);
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

// Dashboard selected unit selectors
export const selectDashboardSelectedUnitId = (state: RootState) => selectTanzeemState(state).dashboardSelectedUnitId;
export const selectDashboardSelectedUnit = createSelector(
  [selectDashboardSelectedUnitId, state => state],
  (unitId, state) => {
    return unitId ? selectTanzeemiUnitById(state, unitId) : null;
  }
);

// Level selectors
export const selectLevelsById = (state: RootState) => selectTanzeemState(state).levelsById;
export const selectLevelById = (levelId: number) => (state: RootState) => selectTanzeemState(state).levelsById[levelId];

// Helper selector to get all units in the user's hierarchy
// Memoized selector for user hierarchy units
export const selectUserHierarchyUnits = createSelector(
  [selectUserUnitHierarchyIds, state => state],
  (hierarchyIds, state) => {
    return hierarchyIds.map(id => selectTanzeemiUnitById(state, id)).filter(Boolean) as TanzeemiUnit[];
  }
);

// Helper selector to get all units in the hierarchy as a flat array
// Memoized selector to prevent unnecessary rerenders
export const selectAllHierarchyUnits = createSelector(
  [selectUserUnitDetails, selectUserHierarchyUnits],
  (userUnit, hierarchyUnits) => {
    // Combine user unit with hierarchy units if it exists
    return userUnit 
      ? [userUnit, ...hierarchyUnits.filter(unit => unit.id !== userUnit.id)] 
      : hierarchyUnits;
  }
);

// Hierarchy selectors
export const selectHierarchyStatus = (state: RootState) => selectTanzeemState(state).hierarchyStatus;
export const selectHierarchyError = (state: RootState) => selectTanzeemState(state).hierarchyError;
export const selectUnitsByLevel = (state: RootState) => selectTanzeemState(state).unitsByLevel;

// Helper selector to get units for a specific level
// Using createSelector with a factory pattern for parameterized selectors
export const selectUnitsByLevelId = (levelId: number) => {
  return createSelector(
    [selectUnitsByLevel, state => state],
    (unitsByLevel, state) => {
      const unitIds = unitsByLevel[levelId] || [];
      return unitIds.map(id => selectTanzeemiUnitById(state, id)).filter(Boolean) as TanzeemiUnit[];
    }
  );
};

// Helper selector to get parent unit of a specific unit
// Using factory pattern for parameterized selector
export const selectParentUnit = (unitId: number) => {
  return createSelector(
    [state => selectTanzeemiUnitById(state, unitId), state => state],
    (unit, state) => {
      if (!unit) return undefined;
      
      const parentId = unit.parent_id || unit.Parent_id;
      if (parentId === undefined || parentId === null) return undefined;
      
      return selectTanzeemiUnitById(state, parentId);
    }
  );
};

// Helper selector to get parent unit with level information
// This returns a formatted string with parent unit name and level, including grandparent if available
// Using a memoized factory to prevent multiple selector instances
const parentUnitWithLevelSelectors = new Map();

export const selectParentUnitWithLevel = (unitId: number) => {
  // Return existing selector if already created
  if (parentUnitWithLevelSelectors.has(unitId)) {
    return parentUnitWithLevelSelectors.get(unitId);
  }
  
  // Create new selector
  const selector = createSelector(
    [state => selectTanzeemiUnitById(state, unitId), state => state],
    (unit, state) => {
      if (!unit || unit.id === -1) return '';
      
      const parentId = unit.Parent_id;
      if (parentId === undefined || parentId === null) return '';
      
      const parentUnit = selectTanzeemiUnitById(state, parentId);
      if (!parentUnit) return '';
      
      // Get the level information for the parent unit
      const parentLevelId = parentUnit.Level_id;
      let parentLevelName = '';


      
      if (parentLevelId && typeof parentLevelId === 'number') {
        // Try to get level name from the levelsById storage
        const tanzeemState = state.tanzeem;
        if (tanzeemState && tanzeemState.levelsById) {
          const levelDetails = tanzeemState.levelsById[parentLevelId];
          if (levelDetails) {
            parentLevelName = levelDetails.Name || '';
          }
        }
      }
      
      // Format parent unit: "Level Name: Unit Name" or just "Unit Name" if no level
      const parentFormatted = parentLevelName ? `${parentLevelName}: ${parentUnit.Name}` : parentUnit.Name || '';
      
      // Check if parent unit has a parent (grandparent)
      const grandparentId = parentUnit.Parent_id;
      if (grandparentId === undefined || grandparentId === null) {
        return parentFormatted;
      }
      
      const grandparentUnit = selectTanzeemiUnitById(state, grandparentId);
      if (!grandparentUnit) {
        return parentFormatted;
      }
      
      // Get the level information for the grandparent unit
      const grandparentLevelId = grandparentUnit.Level_id;
      let grandparentLevelName = '';
      
      if (grandparentLevelId && typeof grandparentLevelId === 'number') {
        // Try to get level name from the levelsById storage
        const tanzeemState = state.tanzeem;
        if (tanzeemState && tanzeemState.levelsById) {
          const levelDetails = tanzeemState.levelsById[grandparentLevelId];
          if (levelDetails) {
            grandparentLevelName = levelDetails.Name || '';
          }
        }
      }
      
      // Format grandparent unit: "Level Name: Unit Name" or just "Unit Name" if no level
      const grandparentFormatted = grandparentLevelName ? `${grandparentLevelName}: ${grandparentUnit.Name}` : grandparentUnit.Name || '';
      
      // Return parent first, then append grandparent with comma separator: "Parent Level: Parent Name, Grandparent Level: Grandparent Name"
      return `${parentFormatted}، ${grandparentFormatted}`;
    }
  );
  
  // Store the selector for reuse
  parentUnitWithLevelSelectors.set(unitId, selector);
  return selector;
};

// Helper selector to get child units of a specific unit
// Using factory pattern for parameterized selector
export const selectChildUnits = (unitId: number) => {
  return createSelector(
    [selectAllTanzeemiUnits],
    (allUnits) => {
      return allUnits.filter(unit => {
        const parentId = unit.parent_id || unit.Parent_id;
        return parentId === unitId;
      });
    }
  );
};

/**
 * Selector to get all tanzeemi units formatted for dropdown
 * Returns an array of objects with label and value properties
 */
export const selectAllTanzeemiUnitsForDropdown = createSelector(
  [selectAllTanzeemiUnits],
  (units) => {
    if (!units || units.length === 0) return [];
    
    return units.map(unit => ({
      id: unit.id.toString(),
      label: unit.Name || `Unit ${unit.id}`,
      value: unit.id.toString()
    }));
  }
);

export default tanzeemSlice.reducer;