import { configureStore, Middleware } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import { mmkvStorage, STORAGE_KEYS } from './mmkvStorage';
import rootReducer from './reducers';
import directus from '../services/directus';
import authMiddleware from './middleware/authMiddleware';

// Define the RootState type explicitly
export type RootState = ReturnType<typeof rootReducer>;

// Enhanced persist configuration with proper typing
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: [STORAGE_KEYS.AUTH, STORAGE_KEYS.ACTIVITIES, STORAGE_KEYS.PERSONS, STORAGE_KEYS.REPORTS, STORAGE_KEYS.TANZEEM],
  // Add version control for migrations
  version: 1,
  // Add state reconciler for better state management
  stateReconciler: (inboundState, originalState) => ({
    ...originalState,
    ...inboundState,
  }),
};

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with enhanced middleware
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['auth.user'],
      },
      // Add additional middleware for better error handling
      thunk: {
        extraArgument: { directus },
      },
    });
    
    // Add the auth middleware
    return middleware.concat(authMiddleware as Middleware);
  },
  // Enable dev tools in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
const persistor = persistStore(store);

// Define AppDispatch type
export type AppDispatch = typeof store.dispatch;

// Export store and persistor
export { store, persistor };