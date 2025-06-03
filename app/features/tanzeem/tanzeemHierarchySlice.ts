import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import { fetchNazimDetails } from '../persons/personSlice';
import { fetchTanzeemLevelById } from './tanzeemSlice';
import { TanzeemiUnit, SingleTanzeemiUnitResponse } from '@/app/models/TanzeemiUnit';
import { Person, PersonResponse } from '@/app/models/Person';
import { normalizeTanzeemiUnitData, normalizePersonData } from '@/app/utils/apiNormalizer';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────────────
 */

// Extend TanzeemiUnit to include the under_mine flag
export interface HierarchyUnit extends TanzeemiUnit {
  under_mine: boolean;
}

// Define the state interface
export interface TanzeemHierarchyState {
  hierarchyUnits: HierarchyUnit[];
  hierarchyIds: number[];
  userUnitId: number | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: TanzeemHierarchyState = {
  hierarchyUnits: [],
  hierarchyIds: [],
  userUnitId: null,
  status: 'idle',
  error: null,
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * API Helper Functions
 * ────────────────────────────────────────────────────────────────────────────────
 */

// Import the centralized API client
import apiClient from '../../services/apiClient';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Helper Functions for Hierarchy Processing
 * ────────────────────────────────────────────────────────────────────────────────
 */

/**
 * Recursively fetch and process a unit's parent hierarchy
 * @param unitId The ID of the unit to fetch parent for
 * @param token Access token
 * @param dispatch Redux dispatch function
 * @param getState Redux getState function
 * @param processedIds Set of already processed unit IDs
 * @param allUnits Array of all units collected so far
 * @returns Object containing the parent unit and all collected units
 */
const fetchAndProcessParentHierarchy = async (
  unitId: number | null,
  dispatch: AppDispatch,
  getState: () => RootState,
  processedIds: Set<number> = new Set(),
  allUnits: HierarchyUnit[] = []
): Promise<{ parentUnits: HierarchyUnit[] }> => {
  // If no unit ID or already processed, return current results
  if (!unitId || processedIds.has(unitId)) {
    return { parentUnits: allUnits };
  }
  
  processedIds.add(unitId);
  
  try {
    // Use the centralized API client which handles token refresh automatically
    const response = await apiClient<SingleTanzeemiUnitResponse>(() => ({
      path: `/items/Tanzeemi_Unit/${unitId}?fields=*`,
      method: 'GET'
    }));
    
    // Handle both possible response structures
    let unitData: any;
    if (response.data) {
      // Wrapped in data property
      unitData = response.data;
    } else if ((response as any).id) {
      // Direct unit object response
      unitData = response;
    } else {
      console.log(`Tanzeemi unit with ID ${unitId} not found`);
      return { parentUnits: allUnits };
    }
    
    // Transform the API response to match our expected format
    const unit = normalizeTanzeemiUnitData(unitData);
    
    // Add the current unit to our collection as a parent unit (under_mine: false)
    const hierarchyUnit: HierarchyUnit = {
      ...unit,
      under_mine: false
    };
    allUnits.push(hierarchyUnit);
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (unit.Nazim_id) {
      console.log(`Parent unit ${unitId} has Nazim_id: ${unit.Nazim_id}, fetching Nazim details...`);
      // dispatch(fetchNazimDetails(unit.Nazim_id));
    }
    
    // If the unit has a Level_id, fetch the level details
    if (unit.Level_id || unit.level_id) {
      const levelId = unit.Level_id || unit.level_id;
      if (typeof levelId === 'number') {
        dispatch(fetchTanzeemLevelById(levelId));
      }
    }
    
    // Recursively fetch the parent unit if it exists
    const parentId = unit.Parent_id || unit.parent_id;
    if (parentId && typeof parentId === 'number' && !processedIds.has(parentId)) {
      const result = await fetchAndProcessParentHierarchy(
        parentId,
        dispatch,
        getState,
        processedIds,
        allUnits
      );
      
      // Merge the parent units
      return { parentUnits: result.parentUnits };
    }
    
    return { parentUnits: allUnits };
  } catch (error) {
    console.error(`Error fetching parent unit ${unitId} in hierarchy:`, error);
    return { parentUnits: allUnits };
  }
};

/**
 * Recursively fetch and process a unit's subordinate hierarchy
 * @param unitId The ID of the unit to fetch subordinates for
 * @param token Access token
 * @param dispatch Redux dispatch function
 * @param getState Redux getState function
 * @param processedIds Set of already processed unit IDs
 * @param allUnits Array of all units collected so far
 * @returns Object containing the subordinate units and all collected units
 */
const fetchAndProcessSubordinateHierarchy = async (
  unitId: number,
  dispatch: AppDispatch,
  getState: () => RootState,
  processedIds: Set<number> = new Set(),
  allUnits: HierarchyUnit[] = []
): Promise<{ subordinateUnits: HierarchyUnit[] }> => {
  // If already processed, return current results
  if (processedIds.has(unitId)) {
    return { subordinateUnits: allUnits };
  }
  
  processedIds.add(unitId);
  
  try {
    // Use the centralized API client which handles token refresh automatically
    const response = await apiClient<SingleTanzeemiUnitResponse>(() => ({
      path: `/items/Tanzeemi_Unit/${unitId}?fields=*`,
      method: 'GET'
    }));
    
    // Handle both possible response structures
    let unitData: any;
    if (response.data) {
      // Wrapped in data property
      unitData = response.data;
    } else if ((response as any).id) {
      // Direct unit object response
      unitData = response;
    } else {
      console.log(`Tanzeemi unit with ID ${unitId} not found`);
      return { subordinateUnits: allUnits };
    }
    
    // Transform the API response to match our expected format
    const unit = normalizeTanzeemiUnitData(unitData);
    
    // Add the current unit to our collection as a subordinate unit (under_mine: true)
    // except for the user's unit itself which should be under_mine: false
    const hierarchyUnit: HierarchyUnit = {
      ...unit,
      under_mine: true
    };
    allUnits.push(hierarchyUnit);
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (unit.Nazim_id) {
      console.log(`Subordinate unit ${unitId} has Nazim_id: ${unit.Nazim_id}, fetching Nazim details...`);
      // dispatch(fetchNazimDetails(unit.Nazim_id));
    }
    
    // If the unit has a Level_id, fetch the level details
    if (unit.Level_id || unit.level_id) {
      const levelId = unit.Level_id || unit.level_id;
      if (typeof levelId === 'number') {
        dispatch(fetchTanzeemLevelById(levelId));
      }
    }
    
    // Process zaili_unit_hierarchy if it exists and is an array
    if (unit.zaili_unit_hierarchy && Array.isArray(unit.zaili_unit_hierarchy)) {
      console.log(`Processing zaili_unit_hierarchy for subordinate unit ${unitId}:`, unit.zaili_unit_hierarchy);
      
      // Recursively fetch each unit in the hierarchy
      const hierarchyIds = unit.zaili_unit_hierarchy as number[];
      for (const childId of hierarchyIds) {
        if (typeof childId === 'number' && !processedIds.has(childId)) {
          const result = await fetchAndProcessSubordinateHierarchy(
            childId, 
            dispatch, 
            getState, 
            processedIds,
            allUnits
          );
          
          // The subordinate units are already added to allUnits
        }
      }
    }
    
    return { subordinateUnits: allUnits };
  } catch (error) {
    console.error(`Error fetching subordinate unit ${unitId} in hierarchy:`, error);
    return { subordinateUnits: allUnits };
  }
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Thunk to fetch the complete Tanzeemi hierarchy
 * ────────────────────────────────────────────────────────────────────────────────
 */
export const fetchCompleteTanzeemiHierarchy = createAsyncThunk<
  { hierarchyUnits: HierarchyUnit[], hierarchyIds: number[], userUnitId: number },
  string, // User email
  { state: RootState; dispatch: AppDispatch; rejectValue: string }
>('tanzeemHierarchy/fetchComplete', async (userEmail, { getState, dispatch, rejectWithValue }) => {
  try {
    console.log('Fetching complete tanzeemi hierarchy for user email:', userEmail);
    
    // Step 1: Fetch user details by email using the centralized API client
    // Normalize the email to lowercase to ensure consistent handling
    const normalizedEmail = userEmail.trim().toLowerCase();
    
    console.log('Fetching person by email:', normalizedEmail);
    
    // Construct the URL with proper encoding
    const params = new URLSearchParams();
    params.append('filter[Email][_eq]', normalizedEmail);
    params.append('fields', '*');
    
    const personResponse = await apiClient<PersonResponse>(() => ({
      path: `/items/Person?${params.toString()}`,
      method: 'GET'
    }));
    
    console.log('API Response for person by email:', personResponse);
    
    // Handle both possible response structures
    let personData: any[];
    if (Array.isArray(personResponse)) {
      // Direct array response
      personData = personResponse;
    } else if (personResponse.data && Array.isArray(personResponse.data)) {
      // Wrapped in data property
      personData = personResponse.data;
    } else {
      throw new Error(`Invalid response structure for email ${normalizedEmail}`);
    }
    
    if (!personData || personData.length === 0) {
      throw new Error(`No person found with email ${normalizedEmail}`);
    }
    
    const user = normalizePersonData(personData[0]);
    
    // Step 2: Extract the Tanzeemi_Unit ID from the user's record
    const userUnitId = user.Tanzeemi_Unit || user.unit;
    if (!userUnitId || typeof userUnitId !== 'number') {
      return rejectWithValue(`User with email ${userEmail} has no Tanzeemi unit assigned`);
    }
    
    console.log(`User ${user.Name || user.name} has Tanzeemi unit ID: ${userUnitId}`);
    
    // Step 3: Fetch the user's unit details
    const unitResponse = await apiClient<SingleTanzeemiUnitResponse>(() => ({
      path: `/items/Tanzeemi_Unit/${userUnitId}?fields=*`,
      method: 'GET'
    }));
    
    console.log('API Response for user tanzeemi unit:', unitResponse);
    
    // Handle both possible response structures
    let unitData: any;
    if (unitResponse.data) {
      // Wrapped in data property
      unitData = unitResponse.data;
    } else if ((unitResponse as any).id) {
      // Direct unit object response
      unitData = unitResponse;
    } else {
      throw new Error(`Tanzeemi unit with ID ${userUnitId} not found`);
    }
    
    const userUnit = normalizeTanzeemiUnitData(unitData);
    
    // Create the user's unit with under_mine: false
    const userHierarchyUnit: HierarchyUnit = {
      ...userUnit,
      under_mine: false
    };
    
    // Step 4: Fetch the user's unit Nazim details if available
    if (userUnit.Nazim_id) {
      console.log(`User unit has Nazim_id: ${userUnit.Nazim_id}, fetching Nazim details...`);
      dispatch(fetchNazimDetails(userUnit.Nazim_id));
    }
    
    // Step 5: Fetch the user's unit Level details if available
    if (userUnit.Level_id || userUnit.level_id) {
      const levelId = userUnit.Level_id || userUnit.level_id;
      if (typeof levelId === 'number') {
        dispatch(fetchTanzeemLevelById(levelId));
      }
    }
    
    // Step 6: Recursively fetch all parent units (using parent_id)
    const parentId = userUnit.Parent_id || userUnit.parent_id;
    const { parentUnits } = await fetchAndProcessParentHierarchy(
      parentId as number,
      dispatch,
      getState
    );
    
    console.log(`Fetched ${parentUnits.length} parent units for user unit ${userUnitId}`);
    
    // Step 7: Recursively fetch all subordinate units (using zaili_unit_hierarchy)
    const processedIds = new Set<number>([userUnitId]); // Mark user unit as processed
    const subordinateUnits: HierarchyUnit[] = [];
    
    if (userUnit.zaili_unit_hierarchy && Array.isArray(userUnit.zaili_unit_hierarchy)) {
      console.log(`Processing zaili_unit_hierarchy for user unit ${userUnitId}:`, userUnit.zaili_unit_hierarchy);
      
      const hierarchyIds = userUnit.zaili_unit_hierarchy as number[];
      for (const childId of hierarchyIds) {
        if (typeof childId === 'number' && !processedIds.has(childId)) {
          const result = await fetchAndProcessSubordinateHierarchy(
            childId,
            dispatch,
            getState,
            processedIds
          );
          
          subordinateUnits.push(...result.subordinateUnits);
        }
      }
    }
    
    console.log(`Fetched ${subordinateUnits.length} subordinate units for user unit ${userUnitId}`);
    
    // Step 8: Combine all units and create a unique set of IDs
    const allUnits: HierarchyUnit[] = [userHierarchyUnit, ...parentUnits, ...subordinateUnits];
    const uniqueIds = [...new Set(allUnits.map(unit => unit.id))];
    
    console.log(`Complete hierarchy contains ${allUnits.length} units with ${uniqueIds.length} unique IDs`);
    
    return {
      hierarchyUnits: allUnits,
      hierarchyIds: uniqueIds,
      userUnitId
    };
  } catch (error: any) {
    console.error('Fetch complete tanzeemi hierarchy error:', error);
    return rejectWithValue(error.message || 'Failed to fetch complete tanzeemi hierarchy');
  }
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Slice
 * ────────────────────────────────────────────────────────────────────────────────
 */
const tanzeemHierarchySlice = createSlice({
  name: 'tanzeemHierarchy',
  initialState,
  reducers: {
    clearHierarchy(state) {
      state.hierarchyUnits = [];
      state.hierarchyIds = [];
      state.userUnitId = null;
      state.status = 'idle';
      state.error = null;
    },
    updateUnitInHierarchy(state, action: PayloadAction<HierarchyUnit>) {
      const index = state.hierarchyUnits.findIndex(unit => unit.id === action.payload.id);
      if (index !== -1) {
        state.hierarchyUnits[index] = action.payload;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCompleteTanzeemiHierarchy.pending, state => {
        console.log('⏳ fetchCompleteTanzeemiHierarchy.pending');
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCompleteTanzeemiHierarchy.fulfilled, (state, action) => {
        console.log('🎉 fetchCompleteTanzeemiHierarchy.fulfilled - payload:', action.payload);
        state.status = 'succeeded';
        state.hierarchyUnits = action.payload.hierarchyUnits;
        state.hierarchyIds = action.payload.hierarchyIds;
        state.userUnitId = action.payload.userUnitId;
        console.log('🎉 Updated state - hierarchyUnits:', state.hierarchyUnits?.length || 0, 'units');
      })
      .addCase(fetchCompleteTanzeemiHierarchy.rejected, (state, action) => {
        console.log('❌ fetchCompleteTanzeemiHierarchy.rejected - error:', action.payload);
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch hierarchy';
      });
  },
});

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * Selectors
 * ────────────────────────────────────────────────────────────────────────────────
 */

// Basic selectors
export const selectTanzeemHierarchyState = (state: RootState) => state.tanzeemHierarchy;

// Memoized selectors
export const selectAllHierarchyUnits = createSelector(
  [selectTanzeemHierarchyState],
  (hierarchyState) => {
    console.log('selectAllHierarchyUnits - hierarchyState:', hierarchyState);
    console.log('selectAllHierarchyUnits - hierarchyUnits:', hierarchyState.hierarchyUnits?.length || 0, 'units');
    return hierarchyState.hierarchyUnits;
  }
);

export const selectHierarchyIds = createSelector(
  [selectTanzeemHierarchyState],
  (hierarchyState) => hierarchyState.hierarchyIds
);

export const selectUserUnitId = createSelector(
  [selectTanzeemHierarchyState],
  (hierarchyState) => hierarchyState.userUnitId
);

export const selectUserUnit = createSelector(
  [selectAllHierarchyUnits, selectUserUnitId],
  (units, userUnitId) => units.find(unit => unit.id === userUnitId) || null
);

export const selectSubordinateUnits = createSelector(
  [selectAllHierarchyUnits],
  (units) => units.filter(unit => unit.under_mine)
);

export const selectParentUnits = createSelector(
  [selectAllHierarchyUnits, selectUserUnitId],
  (units, userUnitId) => units.filter(unit => !unit.under_mine && unit.id !== userUnitId)
);

// Selector for subordinate units display text (used in Dashboard)
export const selectSubordinateUnitsDisplayText = createSelector(
  [selectAllHierarchyUnits],
  (hierarchyUnits) => {
    console.log('selectSubordinateUnitsDisplayText - hierarchyUnits:', hierarchyUnits?.length || 0, 'units');
    console.log('selectSubordinateUnitsDisplayText - hierarchyUnits data:', hierarchyUnits);
    
    if (!hierarchyUnits || hierarchyUnits.length <= 1) return '';
    
    const subordinateText = hierarchyUnits
      .slice(1)
      .map((unit) => unit.Name || unit.name)
      .filter(Boolean)
      .join('، ');
    
    console.log('selectSubordinateUnitsDisplayText - subordinateText:', subordinateText);
    
    return subordinateText.length > 30 
      ? subordinateText.substring(0, 27) + '...' 
      : subordinateText;
  }
);

// Selector for dropdown options (subordinate units only)
export const selectSubordinateUnitsForDropdown = createSelector(
  [selectAllHierarchyUnits],
  (hierarchyUnits) => {
    console.log('selectSubordinateUnitsForDropdown - hierarchyUnits:', hierarchyUnits?.length || 0, 'units');
    console.log('selectSubordinateUnitsForDropdown - hierarchyUnits data:', hierarchyUnits);
    
    if (!hierarchyUnits || hierarchyUnits.length <= 1) return [];
    
    const dropdownOptions = hierarchyUnits
      .slice(1) // Skip the first unit (user's own unit)
      .map(unit => ({
        id: unit.id.toString(),
        label: unit.name || unit.Name || `Unit ${unit.id}`,
        value: unit.id.toString()
      }));
    
    console.log('selectSubordinateUnitsForDropdown - dropdownOptions:', dropdownOptions);
    
    return dropdownOptions;
  }
);

export const selectHierarchyStatus = createSelector(
  [selectTanzeemHierarchyState],
  (hierarchyState) => hierarchyState.status
);

export const selectHierarchyError = createSelector(
  [selectTanzeemHierarchyState],
  (hierarchyState) => hierarchyState.error
);

// Export actions and reducer
export const { clearHierarchy, updateUnitInHierarchy } = tanzeemHierarchySlice.actions;
export default tanzeemHierarchySlice.reducer;