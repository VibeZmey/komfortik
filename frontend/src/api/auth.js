import { apiClient, refreshStoredSession } from './client';
import { useAuthStore } from '../store/authStore';

function cleanLoginPart(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

function decodeJWT(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function buildLoginFromEmail(email) {
  const [localPart = 'user'] = String(email).split('@');
  const safeLocalPart = cleanLoginPart(localPart) || 'user';
  const hash = String(email)
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7)
    .toString(36)
    .slice(0, 6);

  return `${safeLocalPart}-${hash}`;
}

export async function registerUser(payload) {
  const requestPayload = {
    login: buildLoginFromEmail(payload.email),
    email: payload.email,
    password: payload.password,
  };

  return apiClient.post('/auth/register', requestPayload);
}

export async function loginUser(payload) {
  return apiClient.post('/auth/login', {
    email: payload.email,
    password: payload.password,
  });
}

export async function confirmEmail(token) {
  const response = await apiClient.post(
    `/auth/email-confirm?token=${encodeURIComponent(token)}`
  );

  const data = response.data;
  useAuthStore.getState().setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  const jwtPayload = decodeJWT(data.accessToken);
  if (jwtPayload) {
    useAuthStore.getState().setUser({
      role: jwtPayload.role,
      email: jwtPayload.email,
      userId: jwtPayload.userId,
    });
  }

  return response;
}

export async function getMe() {
  const response = await apiClient.get('/users/me');
  const userData = response.data;

  const state = useAuthStore.getState();
  const jwtPayload = decodeJWT(state.accessToken);
  if (jwtPayload && jwtPayload.role) {
    userData.role = jwtPayload.role;
  }

  useAuthStore.getState().setUser(userData);
  return userData;
}

export async function restoreSession() {
  const state = useAuthStore.getState();

  if (!state.refreshToken) {
    useAuthStore.getState().setStatus('anonymous');
    return null;
  }

  await refreshStoredSession();
  await getMe();
  useAuthStore.getState().setStatus('authenticated');
  return useAuthStore.getState().user;
}




