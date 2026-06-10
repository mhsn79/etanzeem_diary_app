import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '@/src/store/types';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 