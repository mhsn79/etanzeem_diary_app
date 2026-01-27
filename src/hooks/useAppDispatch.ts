import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../app/store/types';

export const useAppDispatch = () => useDispatch<AppDispatch>(); 