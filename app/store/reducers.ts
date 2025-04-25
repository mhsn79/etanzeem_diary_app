import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth slice
import activitiesReducer from '../features/activities/activitySlice';
import activityTypesReducer from '../features/activityTypes/activityTypesSlice';
import personsReducer from '../features/persons/personSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer, // Include the auth slice
  activities: activitiesReducer,
  activityTypes: activityTypesReducer,
  persons: personsReducer,
});

export default rootReducer; 