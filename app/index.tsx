import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { selectIsAuthenticated, initializeAuth } from './features/auth/authSlice';
import { useEffect } from 'react';

function IndexContent() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  // Initialize auth and fetch user data when app starts
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[DEBUG] 🔄 Initializing auth and fetching user data...');
      dispatch(initializeAuth());
    }
  }, [isAuthenticated, dispatch]);

  // The AuthGuard in _layout.tsx will handle the navigation logic
  // This component just needs to redirect based on authentication state
  // Use a simple approach that doesn't conflict with AuthGuard
  if (isAuthenticated) {
    return <Redirect href="/screens/(tabs)/Dashboard" />;
  } else {
    return <Redirect href="/screens/LoginScreen" />;
  }
}

export default function Index() {
  return <IndexContent />;
}
