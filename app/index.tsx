import { Redirect } from 'expo-router';
import { useAppSelector } from '@/src/hooks/redux';
import { selectIsAuthed } from '@/app/features/auth/authSlice';

export default function Index() {
  const isAuthed = useAppSelector(selectIsAuthed);
  return isAuthed
    ? <Redirect href="/screens/Dashboard" />
    : <Redirect href="/screens/LoginScreen" />;
}
