import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth slice
import activitiesReducer from '../features/activities/activitySlice';
import activityTypesReducer from '../features/activityTypes/activityTypesSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer, // Include the auth slice
  activities: activitiesReducer,
  activityTypes: activityTypesReducer,
});

export default rootReducer; 