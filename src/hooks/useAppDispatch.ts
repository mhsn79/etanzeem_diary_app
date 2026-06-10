import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/src/store/types';

export const useAppDispatch = () => useDispatch<AppDispatch>(); 