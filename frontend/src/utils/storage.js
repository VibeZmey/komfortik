import { STORAGE_KEYS } from '../config';

const isBrowser = typeof window !== 'undefined';

function getStorage() {
  if (!isBrowser) {
    return null;
  }

  return window.sessionStorage;
}

export function readAuthStorage() {
  const storage = getStorage();

  if (!storage) {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: storage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: storage.getItem(STORAGE_KEYS.refreshToken),
  };
}

export function writeAuthStorage(tokens) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (tokens.accessToken) {
    storage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  } else {
    storage.removeItem(STORAGE_KEYS.accessToken);
  }

  if (tokens.refreshToken) {
    storage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  } else {
    storage.removeItem(STORAGE_KEYS.refreshToken);
  }
}

export function clearAuthStorage() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(STORAGE_KEYS.accessToken);
  storage.removeItem(STORAGE_KEYS.refreshToken);
}

