import type { Store } from '@reduxjs/toolkit';

type StoreLike = Pick<Store, 'getState' | 'dispatch'>;
type PersistorLike = { purge: () => Promise<any> };

let storeRef: StoreLike | null = null;
let persistorRef: PersistorLike | null = null;

export const setStore = (store: StoreLike) => {
  storeRef = store;
};

export const getStore = (): StoreLike => {
  if (!storeRef) {
    throw new Error('Store has not been initialized in storeAccess');
  }
  return storeRef;
};

export const setPersistor = (persistor: PersistorLike) => {
  persistorRef = persistor;
};

export const getPersistor = (): PersistorLike => {
  if (!persistorRef) {
    throw new Error('Persistor has not been initialized in storeAccess');
  }
  return persistorRef;
};

export const ensureStoreInitialized = () => {
  if (storeRef) return;
  try {
    // Lazy-load store if it hasn't been set yet
    const { store, persistor } = require('../store');
    if (store) {
      setStore(store);
    }
    if (persistor) {
      setPersistor(persistor);
    }
  } catch {
    // Ignore - caller will handle missing store
  }
};

export default {
  setStore,
  getStore,
  setPersistor,
  getPersistor,
  ensureStoreInitialized,
};
