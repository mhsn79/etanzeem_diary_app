import { getStore, ensureStoreInitialized } from '../store/storeAccess';
import { Platform } from 'react-native';

let refreshPromise: Promise<any> | null = null;
let logoutInProgress = false;

export const refreshOnce = async (reason: string): Promise<any> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    ensureStoreInitialized();
    const store = getStore();
    const { refresh, logout } = require('../features/auth/authSlice');

    try {
      console.log(`[AuthRefresh] Starting refresh (${reason}) (${Platform.OS})`);
      const result = await store.dispatch(refresh()).unwrap();
      console.log(`[AuthRefresh] Refresh succeeded (${reason}) (${Platform.OS})`);
      return result;
    } catch (error: any) {
      console.error(`[AuthRefresh] Refresh failed (${reason}) (${Platform.OS}):`, error?.message || error);

      if (!logoutInProgress) {
        logoutInProgress = true;
        try {
          store.dispatch(logout('Authentication expired. Please log in again.'));
        } finally {
          logoutInProgress = false;
        }
      }

      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const isRefreshInProgress = () => !!refreshPromise;

export default {
  refreshOnce,
  isRefreshInProgress,
};
