import { getStore, ensureStoreInitialized } from '../store/storeAccess';
import { Platform } from 'react-native';
import { authLogger } from '../utils/logger';

let refreshPromise: Promise<any> | null = null;
let logoutInProgress = false;
let refreshStartTime: number | null = null;

// Maximum time to wait for a refresh operation (10 seconds)
const REFRESH_TIMEOUT_MS = 10000;

export const refreshOnce = async (reason: string): Promise<any> => {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    authLogger.debug(`Refresh already in progress, waiting... (${reason})`);

    // Check if the refresh has been running too long
    if (refreshStartTime && Date.now() - refreshStartTime > REFRESH_TIMEOUT_MS) {
      authLogger.warn(`Refresh timeout detected (${reason}), creating new refresh attempt`);
      refreshPromise = null;
      refreshStartTime = null;
    } else {
      return refreshPromise;
    }
  }

  refreshStartTime = Date.now();

  refreshPromise = (async () => {
    ensureStoreInitialized();
    const store = getStore();
    const { refresh, logout } = require('../features/auth/authSlice');

    try {
      authLogger.info(`Starting refresh (${reason}) (${Platform.OS})`);
      const result = await store.dispatch(refresh()).unwrap();
      authLogger.info(`Refresh succeeded (${reason}) (${Platform.OS})`);

      // Wait a small amount of time to ensure Redux state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      return result;
    } catch (error: any) {
      authLogger.error(`Refresh failed (${reason}) (${Platform.OS}):`, error?.message || error);

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
      // Clear the promise only after everything is complete
      // Use setTimeout to ensure this happens after the return
      setTimeout(() => {
        refreshPromise = null;
        refreshStartTime = null;
      }, 200);
    }
  })();

  return refreshPromise;
};

export const isRefreshInProgress = () => !!refreshPromise;

export default {
  refreshOnce,
  isRefreshInProgress,
};
