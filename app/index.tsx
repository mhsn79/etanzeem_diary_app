import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { selectIsAuthenticated, initializeAuth } from './features/auth/authSlice';
import { useEffect } from 'react';

export default function Index() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  // Initialize auth and fetch user data when app starts
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[DEBUG] 🔄 Initializing auth and fetching user data...');
      dispatch(initializeAuth());
    }
  }, [isAuthenticated, dispatch]);

  return isAuthenticated
    ? <Redirect href="/screens/Dashboard" />
    : <Redirect href="/screens/LoginScreen" />;
}
