import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth slice
import activitiesReducer from '../features/activities/activitySlice';
import activityTypesReducer from '../features/activityTypes/activityTypesSlice';
import personsReducer from '../features/persons/personSlice';
import reportsReducer from '../features/reports/reportsSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer, // Include the auth slice
  activities: activitiesReducer,
  activityTypes: activityTypesReducer,
  persons: personsReducer,
  reports: reportsReducer,
});

export default rootReducer; 