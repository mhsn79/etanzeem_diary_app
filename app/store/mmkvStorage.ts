import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import { Storage } from 'redux-persist';

// Define storage keys for better type safety
export const STORAGE_KEYS = {
  AUTH: 'auth',
  ACTIVITIES: 'activities',
  PERSONS: 'persons',
  REPORTS: 'reports',
  TAZEEM: 'tazeem',
} as const;

type StorageKeys = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

let mmkv: MMKV | null = null;

try {
  mmkv = new MMKV({
    id: 'redux-persist',
    encryptionKey: 'your-secure-encryption-key', // In production, use a secure key management system
  });
} catch (error) {
  console.warn('[storage] MMKV unavailable – using AsyncStorage', error);
}

// Enhanced storage interface with proper typing
export const mmkvStorage: Storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (mmkv) {
        mmkv.set(key, value);
        return Promise.resolve();
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item for key ${key}:`, error);
      throw error;
    }
  },
  
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (mmkv) {
        const value = mmkv.getString(key);
        return Promise.resolve(value ?? null);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item for key ${key}:`, error);
      return null;
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      if (mmkv) {
        mmkv.delete(key);
        return Promise.resolve();
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item for key ${key}:`, error);
      throw error;
    }
  },
}; 