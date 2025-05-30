import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AuthTokens } from '../features/auth/authSlice';

// Define keys for storage
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'etanzeem_access_token',
  REFRESH_TOKEN: 'etanzeem_refresh_token',
  EXPIRES_AT: 'etanzeem_expires_at',
};

// Memory cache for web platform or when AsyncStorage is unavailable
const memoryCache: Record<string, string> = {};

/**
 * Save tokens to storage
 * Falls back to memory cache on web or when AsyncStorage fails
 */
export const saveTokens = async (tokens: AuthTokens): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web platform: use memory cache
      memoryCache[STORAGE_KEYS.ACCESS_TOKEN] = tokens.accessToken;
      memoryCache[STORAGE_KEYS.REFRESH_TOKEN] = tokens.refreshToken;
      memoryCache[STORAGE_KEYS.EXPIRES_AT] = tokens.expiresAt.toString();
    } else {
      // Native platforms: use AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString());
    }
  } catch (error) {
    console.error('Failed to save tokens to storage:', error);
    // Fallback to memory cache if AsyncStorage fails
    memoryCache[STORAGE_KEYS.ACCESS_TOKEN] = tokens.accessToken;
    memoryCache[STORAGE_KEYS.REFRESH_TOKEN] = tokens.refreshToken;
    memoryCache[STORAGE_KEYS.EXPIRES_AT] = tokens.expiresAt.toString();
  }
};

/**
 * Get tokens from storage
 * Falls back to memory cache on web or when AsyncStorage fails
 */
export const getTokens = async (): Promise<AuthTokens | null> => {
  try {
    let accessToken: string | null;
    let refreshToken: string | null;
    let expiresAtStr: string | null;

    if (Platform.OS === 'web') {
      // Web platform: use memory cache
      accessToken = memoryCache[STORAGE_KEYS.ACCESS_TOKEN] || null;
      refreshToken = memoryCache[STORAGE_KEYS.REFRESH_TOKEN] || null;
      expiresAtStr = memoryCache[STORAGE_KEYS.EXPIRES_AT] || null;
    } else {
      // Native platforms: use AsyncStorage
      accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      expiresAtStr = await AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    }

    if (!accessToken || !refreshToken || !expiresAtStr) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAtStr, 10),
    };
  } catch (error) {
    console.error('Failed to get tokens from storage:', error);
    
    // Fallback to memory cache if AsyncStorage fails
    const accessToken = memoryCache[STORAGE_KEYS.ACCESS_TOKEN] || null;
    const refreshToken = memoryCache[STORAGE_KEYS.REFRESH_TOKEN] || null;
    const expiresAtStr = memoryCache[STORAGE_KEYS.EXPIRES_AT] || null;
    
    if (!accessToken || !refreshToken || !expiresAtStr) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAtStr, 10),
    };
  }
};

/**
 * Clear all tokens from storage
 */
export const clearTokens = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web platform: clear memory cache
      delete memoryCache[STORAGE_KEYS.ACCESS_TOKEN];
      delete memoryCache[STORAGE_KEYS.REFRESH_TOKEN];
      delete memoryCache[STORAGE_KEYS.EXPIRES_AT];
    } else {
      // Native platforms: clear AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    }
  } catch (error) {
    console.error('Failed to clear tokens from storage:', error);
    // Clear memory cache as fallback
    delete memoryCache[STORAGE_KEYS.ACCESS_TOKEN];
    delete memoryCache[STORAGE_KEYS.REFRESH_TOKEN];
    delete memoryCache[STORAGE_KEYS.EXPIRES_AT];
  }
};