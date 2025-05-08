import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth slice
import activitiesReducer from '../features/activities/activitySlice';
import activityTypesReducer from '../features/activityTypes/activityTypesSlice';
import personsReducer from '../features/persons/personSlice';
import reportsReducer from '../features/reports/reportsSlice';
import reportsNewReducer from '../features/reports/reportsSlice_new';
import tanzeemReducer from '../features/tanzeem/tanzeemSlice';
import qaReducer from '../features/qa/qaSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer, // Include the auth slice
  activities: activitiesReducer,
  activityTypes: activityTypesReducer,
  persons: personsReducer,
  reports: reportsReducer,
  reportsNew: reportsNewReducer, // Add the new reports slice
  tanzeem: tanzeemReducer,
  qa: qaReducer, // Add the QA slice
});

export default rootReducer; 