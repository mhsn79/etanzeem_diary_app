import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store/types';
import { fetchNazimDetails } from '../persons/personSlice';
import { fetchTanzeemLevelById, selectAllTanzeemiUnits } from './tanzeemSlice';
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
// Falls back to all tanzeemi units if hierarchy units are not available
export const selectSubordinateUnitsForDropdown = createSelector(
  [
    selectAllHierarchyUnits, 
    selectUserUnitId, 
    (state: RootState) => state.tanzeem?.levelsById || {},
    (state: RootState) => state.tanzeem?.userUnitDetails || null,
    selectAllTanzeemiUnits // Fallback: get all units from tanzeem slice if hierarchy is empty
  ],
  (hierarchyUnits, userUnitId, levelsById, userUnitDetails, allTanzeemiUnits) => {
    console.log('selectSubordinateUnitsForDropdown - hierarchyUnits:', hierarchyUnits?.length || 0, 'units');
    console.log('selectSubordinateUnitsForDropdown - hierarchyUnits data:', hierarchyUnits);
    console.log('selectSubordinateUnitsForDropdown - userUnitId:', userUnitId);
    console.log('selectSubordinateUnitsForDropdown - allTanzeemiUnits fallback:', allTanzeemiUnits?.length || 0, 'units');
    
    // Use hierarchy units if available (more than 1 unit), otherwise fall back to all tanzeemi units
    const unitsToProcess = (hierarchyUnits && hierarchyUnits.length > 1) 
      ? hierarchyUnits 
      : (allTanzeemiUnits && allTanzeemiUnits.length > 0 ? allTanzeemiUnits : []);
    
    // Get current user's unit ID from either hierarchy or userUnitDetails
    const currentUnitId = userUnitId || userUnitDetails?.id || null;
    
    if (!unitsToProcess || unitsToProcess.length === 0) {
      console.log('selectSubordinateUnitsForDropdown - No units available');
      return [];
    }
    
    // Map units with level information and sort data, filtering out the current user's unit and Ward level
    const unitsWithLevelInfo = unitsToProcess
      .filter(unit => {
        // Filter out current user's unit
        if (currentUnitId && unit.id === currentUnitId) {
          return false;
        }
        
        // Filter out Ward (وارڈ) level units - only show UC (یوسی), Zone (زون), and Halqa (حلقہ)
        const levelId = unit.Level_id || unit.level_id;
        const level = levelId && levelsById[levelId] ? levelsById[levelId] : null;
        const levelName = level?.Name || level?.name || '';
        
        // Exclude Ward level (level ID 7 or level name contains "وارڈ" or "Ward")
        if (levelId === 7 || levelName.toLowerCase().includes('ward') || levelName.includes('وارڈ')) {
          return false;
        }
        
        // Only include UC (یوسی - level 6), Zone (زون - level 4), and Halqa (حلقہ - level 3)
        // Also allow other levels if they match the names
        const allowedLevelNames = ['یوسی', 'زون', 'حلقہ', 'uc', 'zone', 'halqa'];
        const isAllowedLevel = allowedLevelNames.some(name => 
          levelName.toLowerCase().includes(name.toLowerCase())
        );
        
        // If level name matches allowed levels, include it
        // Also include if level ID is 3, 4, or 6 (Halqa, Zone, UC)
        if (isAllowedLevel || levelId === 3 || levelId === 4 || levelId === 6) {
          return true;
        }
        
        // If no level info, include it (will be handled in mapping)
        if (!levelId && !levelName) {
          return true;
        }
        
        // Exclude by default if level doesn't match
        return false;
      })
      .map(unit => {
        const levelId = unit.Level_id || unit.level_id;
        const level = levelId && levelsById[levelId] ? levelsById[levelId] : null;
        const levelName = level?.Name || level?.name || '';
        
        // Try multiple possible field names for unit name
        const unitName = unit.Name || unit.name || unit.Description || unit.description || `Unit ${unit.id}`;
        
        // Format label: "Level Name: Unit Name" or just "Unit Name" if no level
        const label = levelName ? `${levelName}: ${unitName}` : unitName;
        
        // Ensure label is never empty (fallback to unit ID if everything fails)
        const finalLabel = label || `Unit ${unit.id}`;
        
        // Debug logging for first unit to understand data structure
        if (unitsToProcess.indexOf(unit) === 0) {
          console.log('Sample unit data:', {
            id: unit.id,
            Name: unit.Name,
            name: unit.name,
            Description: unit.Description,
            description: unit.description,
            levelId,
            levelName,
            finalLabel
          });
        }
        
        // Determine level priority for sorting: UC (1), Zone (2), Halqa/City (3)
        let levelPriority = 999;
        const levelNameLower = levelName.toLowerCase();
        if (levelId === 6 || levelNameLower.includes('یوسی') || levelNameLower.includes('uc')) {
          levelPriority = 1; // UC first
        } else if (levelId === 4 || levelNameLower.includes('زون') || levelNameLower.includes('zone')) {
          levelPriority = 2; // Zone second
        } else if (levelId === 3 || levelNameLower.includes('حلقہ') || levelNameLower.includes('halqa') || levelNameLower.includes('city')) {
          levelPriority = 3; // Halqa/City third
        }
        
        return {
          id: unit.id.toString(),
          label: finalLabel,
          value: unit.id.toString(),
          // Sort fields for sorting
          levelPriority: levelPriority,
          levelSort: level?.sort ?? null,
          unitSort: unit.sort ?? null,
          unitId: unit.id,
          levelId: levelId || null,
        };
      });
    
    // Sort by level priority (UC -> Zone -> Halqa/City), then level sort, then unit sort, then id
    const sortedOptions = unitsWithLevelInfo.sort((a, b) => {
      // First sort by level priority (UC first, then Zone, then Halqa/City)
      if (a.levelPriority !== b.levelPriority) {
        return a.levelPriority - b.levelPriority;
      }
      
      // Then sort by level sort
      const levelSortA = a.levelSort ?? 999999;
      const levelSortB = b.levelSort ?? 999999;
      if (levelSortA !== levelSortB) {
        return levelSortA - levelSortB;
      }
      
      // Then sort by unit sort
      const unitSortA = a.unitSort ?? 999999;
      const unitSortB = b.unitSort ?? 999999;
      if (unitSortA !== unitSortB) {
        return unitSortA - unitSortB;
      }
      
      // Finally sort by id
      return a.unitId - b.unitId;
    });
    
    // Return only the dropdown format (id, label, value)
    const dropdownOptions = sortedOptions.map(unit => ({
      id: unit.id,
      label: unit.label,
      value: unit.value
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