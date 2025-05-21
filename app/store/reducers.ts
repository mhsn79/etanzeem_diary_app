import { combineReducers, AnyAction } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth slice
import activitiesReducer from '../features/activities/activitySlice';
import activityTypesReducer from '../features/activityTypes/activityTypesSlice';
import personsReducer from '../features/persons/personSlice';
import reportsNewReducer from '../features/reports/reportsSlice_new';
import tanzeemReducer from '../features/tanzeem/tanzeemSlice';
import tanzeemHierarchyReducer from '../features/tanzeem/tanzeemHierarchySlice';
import qaReducer from '../features/qa/qaSlice';

// Define a reset action type
export const RESET_STATE = 'RESET_STATE';

// Combine reducers
const appReducer = combineReducers({
  auth: authReducer, // Include the auth slice
  activities: activitiesReducer,
  activityTypes: activityTypesReducer,
  persons: personsReducer,
  reportsNew: reportsNewReducer, // Add the new reports slice
  tanzeem: tanzeemReducer,
  tanzeemHierarchy: tanzeemHierarchyReducer, // Add the tanzeem hierarchy slice
  qa: qaReducer, // Add the QA slice
});

// Root reducer with state reset capability
const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: AnyAction) => {
  // When the RESET_STATE action is dispatched, reset all reducers to their initial state
  if (action.type === RESET_STATE) {
    return appReducer(undefined, action);
  }
  
  return appReducer(state, action);
};

export default rootReducer;