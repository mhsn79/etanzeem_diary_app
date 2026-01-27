import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
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
// This function has been removed since we follow the correct flow:
// login email -> user_id -> Tanzeemi_Unit -> Nazim_id -> Person
// No need to fetch person by email

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
    // No reducers needed since fetchCompleteTanzeemiHierarchy has been removed
    // We follow the correct flow: login email -> user_id -> Tanzeemi_Unit -> Nazim_id -> Person
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