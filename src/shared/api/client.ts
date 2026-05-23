import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { toApiError } from './error-mapper';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

// El token vive en memoria — nunca en localStorage. Esto evita XSS persistente
// y limita la exposicion a la sesion actual. El refresh va por cookie HttpOnly
// gestionada por el backend.
type AccessTokenGetter = () => string | null;

interface ClientInternals {
  setAccessTokenGetter(getter: AccessTokenGetter): void;
  setOnAuthFailure(handler: () => void): void;
  setOnRefresh(handler: () => Promise<string | null>): void;
}

let getAccessToken: AccessTokenGetter = () => null;
let onAuthFailure: () => void = () => undefined;
let refreshAccessToken: (() => Promise<string | null>) | null = null;

export const apiInternals: ClientInternals = {
  setAccessTokenGetter: (g) => {
    getAccessToken = g;
  },
  setOnAuthFailure: (h) => {
    onAuthFailure = h;
  },
  setOnRefresh: (h) => {
    refreshAccessToken = h;
  },
};

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Single-flight para que multiples peticiones simultaneas que reciben 401
// no disparen refreshes en paralelo (compartirian el mismo refresh-cookie).
let pendingRefresh: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Si NO es 401 o ya intentamos refresh, mapeamos el error y lo lanzamos.
    if (status !== 401 || !original || original._retry || !refreshAccessToken) {
      return Promise.reject(toApiError(error));
    }

    // No tiene sentido reintentar el propio refresh.
    if (original.url?.endsWith('/auth/refresh') || original.url?.endsWith('/auth/login')) {
      return Promise.reject(toApiError(error));
    }

    original._retry = true;
    try {
      if (!pendingRefresh) {
        pendingRefresh = refreshAccessToken();
      }
      const newToken = await pendingRefresh;
      pendingRefresh = null;

      if (!newToken) {
        onAuthFailure();
        return Promise.reject(toApiError(error));
      }
      original.headers.set('Authorization', `Bearer ${newToken}`);
      return api(original);
    } catch (refreshErr) {
      pendingRefresh = null;
      onAuthFailure();
      return Promise.reject(toApiError(refreshErr));
    }
  },
);
