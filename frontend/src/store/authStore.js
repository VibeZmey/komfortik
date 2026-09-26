import { create } from 'zustand';
import { clearAuthStorage, readAuthStorage, writeAuthStorage } from '../utils/storage';

const storedTokens = readAuthStorage();

export const useAuthStore = create((set, get) => ({
  accessToken: storedTokens.accessToken,
  refreshToken: storedTokens.refreshToken,
  user: null,
  status: storedTokens.refreshToken ? 'restoring' : 'anonymous',
  error: null,
  setTokens: (tokens) => {
    writeAuthStorage(tokens);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
      error: null,
    });
  },
  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  clearAuth: () => {
    clearAuthStorage();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'anonymous',
      error: null,
    });
  },
  isAuthenticated: () => Boolean(get().accessToken),
}));

