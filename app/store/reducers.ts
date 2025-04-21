import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth slice

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer, // Include the auth slice
});

export default rootReducer; 