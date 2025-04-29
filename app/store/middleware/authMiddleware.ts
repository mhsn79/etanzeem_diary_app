import { Middleware, AnyAction, Dispatch, MiddlewareAPI } from 'redux';
import { isTokenExpiredOrExpiring, refresh } from '../../features/auth/authSlice';
import type { RootState } from '../index';

// Define a type for the dispatch function that can handle thunks
type AppDispatchType = Dispatch & {
  <ReturnType>(action: any): ReturnType;
};

/**
 * Middleware to handle token refreshing
 * This middleware will:
 * 1. Check if the token is expired or about to expire before any API call
 * 2. If so, refresh the token
 */
const authMiddleware = 
  (api: MiddlewareAPI<any, any>) => 
  (next: Dispatch<AnyAction>) => 
  (action: AnyAction) => {
  // Check if the action is an API call
  if (action.type?.endsWith('/pending') && !action.type.includes('auth/')) {
    const state = api.getState() as RootState;
    const tokens = state.auth.tokens;
    
    // If we have tokens and they're expired or about to expire, refresh them
    if (tokens && isTokenExpiredOrExpiring(tokens.expiresAt)) {
      console.log('Token expired or about to expire. Refreshing before API call...');
      
      // Dispatch the refresh action
      (api.dispatch as any)(refresh())
        .then(() => {
          console.log('Token refreshed successfully before API call');
        })
        .catch((error: Error) => {
          console.error('Failed to refresh token before API call:', error);
        });
    }
  }
  
  // Continue with the action
  return next(action);
};

export default authMiddleware;