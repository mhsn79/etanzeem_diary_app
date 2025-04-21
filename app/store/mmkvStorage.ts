import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';

let mmkv: MMKV | null = null;
try {
  mmkv = new MMKV(); // succeeds only when JS runs on‑device
} catch {
  console.warn('[storage] MMKV unavailable – using AsyncStorage');
}

export const mmkvStorage = {
  setItem: (key: string, value: string) =>
    mmkv ? (mmkv.set(key, value), Promise.resolve(true)) : AsyncStorage.setItem(key, value),
  getItem: (key: string) =>
    mmkv ? Promise.resolve(mmkv.getString(key) ?? null) : AsyncStorage.getItem(key),
  removeItem: (key: string) =>
    mmkv ? (mmkv.delete(key), Promise.resolve()) : AsyncStorage.removeItem(key),
}; 