import type rootReducer from './reducers';
import type { store } from './index';

// Define the RootState type explicitly (type-only, no runtime import)
export type RootState = ReturnType<typeof rootReducer>;

// Define AppDispatch type (type-only, no runtime import)
export type AppDispatch = typeof store.dispatch;

// Default export to prevent Expo Router from treating this as a route
export default {};