import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from '../../app/store/types';

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 