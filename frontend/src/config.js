export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const ROUTES = {
  auth: '/auth',
  authConfirm: '/auth/email-confirm',
  authConfirmAlias: '/auth/confirm-email',
  home: '/search',
  profile: '/profile',
};

export const STORAGE_KEYS = {
  accessToken: 'airvibe.accessToken',
  refreshToken: 'airvibe.refreshToken',
};

export const APP_NAME = 'Комфортик';



