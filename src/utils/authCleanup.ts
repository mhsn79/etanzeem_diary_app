// Singleton variables for background refresh management
let backgroundRefreshTimer: NodeJS.Timeout | null = null;
let lastRefreshTime = 0;

/**
 * Set background refresh timer
 */
export const setBackgroundRefreshTimer = (timer: NodeJS.Timeout | null) => {
  backgroundRefreshTimer = timer;
};

/**
 * Set last refresh time
 */
export const setLastRefreshTime = (time: number) => {
  lastRefreshTime = time;
};

/**
 * Get background refresh timer
 */
export const getBackgroundRefreshTimer = () => backgroundRefreshTimer;

/**
 * Get last refresh time
 */
export const getLastRefreshTime = () => lastRefreshTime;

/**
 * Stop background token refresh timer
 */
export const stopBackgroundRefresh = () => {
  if (backgroundRefreshTimer) {
    clearInterval(backgroundRefreshTimer);
    backgroundRefreshTimer = null;
    console.log('[AuthCleanup] 🛑 Background refresh timer stopped');
  }
};

/**
 * Cleanup function for background refresh
 * Call this when the app is shutting down or when you want to stop all background operations
 */
export const cleanupBackgroundRefresh = () => {
  stopBackgroundRefresh();
  lastRefreshTime = 0;
  console.log('[AuthCleanup] 🧹 Background refresh cleanup completed');
};

// Default export to satisfy Expo Router
export default {}; 