import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import { mmkvStorage } from './mmkvStorage'; // Use the custom storage adapter
import rootReducer from './reducers';

// Define the RootState type explicitly to handle persisted state
type RootState = ReturnType<typeof rootReducer>;

// Persist configuration with proper typing
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['auth', 'activities'],
};

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions to avoid serializability warnings
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore specific paths in the state that might be non-serializable
        ignoredPaths: ['auth.user'], // If user object has non-serializable fields
      },
    }), // Thunk is included by default
});

// Create persistor
const persistor = persistStore(store);

// Export store, persistor, and types
export { store, persistor };
export type AppDispatch = typeof store.dispatch;
export type { RootState };