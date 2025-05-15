import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState, AppDispatch } from '../../store';
import {
  selectAuthState,
  checkAndRefreshTokenIfNeeded,
  logout,
} from '../auth/authSlice';
import { fetchNazimDetails } from '../persons/personSlice';
import { fetchTanzeemLevelById } from './tanzeemSlice';
import { TanzeemiUnit, SingleTanzeemiUnitResponse } from '@/app/models/TanzeemiUnit';
import { Person, PersonResponse } from '@/app/models/Person';
import { normalizeTanzeemiUnitData, normalizePersonData } from '@/app/utils/apiNormalizer';
import { API_BASE_URL } from '@/app/constants/api';

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

    if (auth.tokens?.expiresAt && new Date(auth.tokens.expiresAt).getTime() < Date.now() + 60000) {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
      const newAuth = selectAuthState(getState());
      const newToken = newAuth.tokens?.accessToken;
      if (!newToken) throw new Error('Refresh failed');
      return await apiCall(newToken);
    }
    throw new Error(msg);
  }
};

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
  token: string,
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
      return { parentUnits: allUnits };
    }
    
    // Add the current unit to our collection as a parent unit (under_mine: false)
    const hierarchyUnit: HierarchyUnit = {
      ...unit,
      under_mine: false
    };
    allUnits.push(hierarchyUnit);
    
    // If the unit has a Nazim_id, fetch the Nazim details
    if (unit.Nazim_id) {
      console.log(`Parent unit ${unitId} has Nazim_id: ${unit.Nazim_id}, fetching Nazim details...`);
      dispatch(fetchNazimDetails(unit.Nazim_id));
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
        token,
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
  token: string,
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
      return { subordinateUnits: allUnits };
    }
    
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
      dispatch(fetchNazimDetails(unit.Nazim_id));
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
            token, 
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
    
    // Refresh token if needed
    try {
      await dispatch(checkAndRefreshTokenIfNeeded()).unwrap();
    } catch (refreshError) {
      console.error('Token refresh failed in fetchCompleteTanzeemiHierarchy:', refreshError);
      dispatch(logout());
      return rejectWithValue('Authentication expired. Please log in again.');
    }

    const auth = selectAuthState(getState());
    const token = auth.tokens?.accessToken;
    if (!token) return rejectWithValue('No access token');

    // Step 1: Fetch user details by email
    const fetchUserByEmail = async (accessToken: string) => {
      // Normalize the email to lowercase to ensure consistent handling
      const normalizedEmail = userEmail.trim().toLowerCase();
      
      console.log('Fetching person by email:', normalizedEmail);
      
      // Construct the URL with proper encoding
      const url = `/items/Person`;
      const params = new URLSearchParams();
      params.append('filter[Email][_eq]', normalizedEmail);
      params.append('fields', '*');
      
      const response = await apiRequest<PersonResponse>(
        `${url}?${params.toString()}`,
        'GET',
        accessToken
      );
      
      console.log('API Response for person by email:', response);
      
      if (!response.data || response.data.length === 0) {
        throw new Error(`No person found with email ${normalizedEmail}`);
      }
      
      return normalizePersonData(response.data[0]);
    };

    const user = await executeWithTokenRefresh(fetchUserByEmail, token, dispatch, getState);
    
    // Step 2: Extract the Tanzeemi_Unit ID from the user's record
    const userUnitId = user.Tanzeemi_Unit || user.unit;
    if (!userUnitId || typeof userUnitId !== 'number') {
      return rejectWithValue(`User with email ${userEmail} has no Tanzeemi unit assigned`);
    }
    
    console.log(`User ${user.Name || user.name} has Tanzeemi unit ID: ${userUnitId}`);
    
    // Step 3: Fetch the user's unit details
    const fetchUserUnit = async (accessToken: string) => {
      const response = await apiRequest<SingleTanzeemiUnitResponse>(
        `/items/Tanzeemi_Unit/${userUnitId}?fields=*`,
        'GET',
        accessToken
      );
      
      console.log('API Response for user tanzeemi unit:', response);
      
      if (!response.data) {
        throw new Error(`Tanzeemi unit with ID ${userUnitId} not found`);
      }
      
      return normalizeTanzeemiUnitData(response.data);
    };

    const userUnit = await executeWithTokenRefresh(fetchUserUnit, token, dispatch, getState);
    
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
      token,
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
            token,
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
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCompleteTanzeemiHierarchy.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.hierarchyUnits = action.payload.hierarchyUnits;
        state.hierarchyIds = action.payload.hierarchyIds;
        state.userUnitId = action.payload.userUnitId;
      })
      .addCase(fetchCompleteTanzeemiHierarchy.rejected, (state, action) => {
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
  (hierarchyState) => hierarchyState.hierarchyUnits
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