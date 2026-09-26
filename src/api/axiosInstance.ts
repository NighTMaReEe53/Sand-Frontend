import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { ENDPOINTS } from './endpoints';
import { AuthResponse } from '../types/auth.types';
import { translateBackendMessage } from '../lib/errorMessages';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Required to send & receive httpOnly Refresh Token cookies
  timeout: 30_000, // لا تعلّق الواجهة أبداً — فشل سريع وإعادة محاولة على مستوى React Query
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Flag and queue to handle concurrent requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach JWT Access Token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Auto Refresh on 401 & Auto Unwrap standard API envelope
axiosInstance.interceptors.response.use(
  (response) => {
    // Automatically unwrap standard backend API response envelope { success: true, data: ... }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      return {
        ...response,
        data: response.data.data !== undefined ? response.data.data : response.data,
      };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Silently ignore AbortErrors (component unmount / query cancellation)
    if (error.code === 'ERR_CANCELED' || (error as any)?.name === 'AbortError') {
      return Promise.reject(error);
    }

    // ─── Auto-retry transient failures ONCE for idempotent GETs ────────
    // Network drop / timeout / 5xx → single retry after a short backoff.
    // Never retries 4xx (client errors are permanent) or non-GET requests.
    const method = originalRequest?.method?.toUpperCase();
    const isTransient =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.response.status >= 500;
    const canRetry = method === 'GET' && !(originalRequest as any)._retriedTransient && isTransient;
    if (canRetry) {
      (originalRequest as any)._retriedTransient = true;
      await new Promise((r) => setTimeout(r, 700));
      return axiosInstance(originalRequest);
    }

    // Don't intercept refresh or login endpoints to avoid infinite loops
    const isAuthRequest =
      originalRequest?.url?.includes(ENDPOINTS.AUTH.LOGIN) ||
      originalRequest?.url?.includes(ENDPOINTS.AUTH.REFRESH) ||
      originalRequest?.url?.includes(ENDPOINTS.AUTH.REGISTER_STUDENT);

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      // Guests (no token) must never be hijacked to /auth/login — public pages
      // like course details fire some authenticated endpoints by design.
      const hadToken = Boolean(useAuthStore.getState().token);
      if (!hadToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send refresh token cookie to get new access token
        const refreshResponse = await axios.post<any>(
          `${BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
          {},
          { withCredentials: true }
        );

        const refreshData = refreshResponse.data?.data || refreshResponse.data;
        const { accessToken, user } = refreshData || {};
        useAuthStore.getState().setAuth(user, accessToken);
        useCartStore.getState().setOwner(user.id);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ترجمة رسائل الخطأ الإنجليزية القادمة من الباك إند إلى العربية
    // بحيث تُعرض للطالب رسائل عربية في كل التوستات عبر التطبيق
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data && typeof data.message === 'string') {
      data.message = translateBackendMessage(data.message);
    }

    return Promise.reject(error);
  }
);
