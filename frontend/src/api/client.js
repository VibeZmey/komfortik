import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshingPromise = null;

export async function refreshStoredSession() {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  if (!refreshingPromise) {
    refreshingPromise = axios
      .post(
        `${API_BASE_URL}/auth/refresh`,
        JSON.stringify(refreshToken),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((response) => {
        const data = response.data;
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return data;
      })
      .catch((error) => {
        clearAuth();
        throw error;
      })
      .finally(() => {
        refreshingPromise = null;
      });
  }

  return refreshingPromise;
}

apiClient.interceptors.request.use((request) => {
  function isDateString(value) {
    if (typeof value !== 'string') return false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
    return !Number.isNaN(Date.parse(value));
  }
  function convertValue(v) {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return `${v}T00:00:00Z`;
    }
    return v;
  }

  function convertDatesRecursively(obj) {
    if (obj == null) return obj;
    if (Array.isArray(obj)) return obj.map(convertDatesRecursively);
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj === 'object') {
      const res = {};
      for (const [k, val] of Object.entries(obj)) {
        res[k] = convertDatesRecursively(val);
      }
      return res;
    }
    return convertValue(obj);
  }

  if (request.params) {
    try {
      request.params = convertDatesRecursively(request.params);
    } catch (e) {
    }
  }
  if (request.data) {
    try {
      request.data = convertDatesRecursively(request.data);
    } catch (e) {
    }
  }

  if (!request.params && request.url && request.url.includes('?')) {
    try {
      const parsed = new URL(request.url, API_BASE_URL);
      const search = parsed.searchParams;
      let changed = false;
      for (const key of Array.from(search.keys())) {
        const val = search.get(key);
        if (val && typeof val === 'string') {
          if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            search.set(key, `${val}T00:00:00Z`);
            changed = true;
          } else if (!Number.isNaN(Date.parse(val))) {
            const d = new Date(val);
            search.set(key, d.toISOString());
            changed = true;
          }
        }
      }
      if (changed) {
        request.url = parsed.pathname + (parsed.search ? `?${parsed.searchParams.toString()}` : '');
      }
    } catch (e) {
    }
  }

  const token = useAuthStore.getState().accessToken;

  if (token) {
    request.headers = request.headers || {};
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      requestUrl.startsWith('/auth/')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshStoredSession();
      const token = useAuthStore.getState().accessToken;

      if (token) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }

      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);



