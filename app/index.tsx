import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { selectIsAuthenticated } from './features/auth/authSlice';

export default function Index() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated
    ? <Redirect href="/screens/Dashboard" />
    : <Redirect href="/screens/LoginScreen" />;
}
