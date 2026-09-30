import axios from 'axios';
import { apiCache, generateCacheKey } from './apiCache';

let rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').trim().replace(/\/+$/, '');
if (!rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}
const API_BASE_URL = rawBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mams_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated and 403 forbidden
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        // 401 Unauthorized: token expired or invalid -> logout, clear cache, redirect
        apiCache.clearAll();
        localStorage.removeItem('mams_token');
        localStorage.removeItem('mams_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (error.response.status === 403) {
        // 403 Forbidden: authenticated but lacking permissions -> DO NOT LOGOUT
        console.warn('Access Denied (403):', error.response.data?.message || 'You do not have permission to perform this action.');
        window.dispatchEvent(
          new CustomEvent('mams:access_denied', {
            detail: {
              message: error.response.data?.message || 'Access Denied: You do not have permission to perform this action.',
              path: error.config?.url
            }
          })
        );
      }
    }
    return Promise.reject(error);
  }
);

// Wrap api.request with ultra-fast SWR / In-Memory caching & Single-Flight deduplication
const originalRequest = api.request.bind(api);

api.request = async function (configOrUrl, maybeConfig) {
  let config = typeof configOrUrl === 'string'
    ? { url: configOrUrl, ...(maybeConfig || {}) }
    : { ...(configOrUrl || {}) };

  const method = (config.method || 'get').toLowerCase();

  // 1. If it's a GET request and caching is enabled (not bypassed by forceRefresh)
  if (method === 'get' && !config.forceRefresh && !config.noCache) {
    const cacheKey = generateCacheKey(config);
    const cached = apiCache.get(cacheKey);

    // Cache HIT -> Return immediately (0ms instant page render)
    if (cached) {
      return {
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: { 'x-mams-cache': 'HIT' },
        config,
      };
    }

    // Single-Flight: If exact same request is already in-flight, await it to prevent duplicate network calls
    if (apiCache.hasPending(cacheKey)) {
      return apiCache.getPending(cacheKey);
    }

    const requestPromise = originalRequest(config)
      .then((response) => {
        if (response.status >= 200 && response.status < 300 && response.data) {
          apiCache.set(cacheKey, response.data, config.cacheTtl);
        }
        return response;
      })
      .finally(() => {
        apiCache.removePending(cacheKey);
      });

    apiCache.setPending(cacheKey, requestPromise);
    return requestPromise;
  }

  // 2. Non-cached request (POST, PUT, DELETE, PATCH, or GET with forceRefresh)
  const response = await originalRequest(config);

  // Auto-evict cache and notify active views when data mutations happen
  if (method !== 'get' && response.status >= 200 && response.status < 300) {
    apiCache.invalidateForMutation(config.url);
    window.dispatchEvent(new CustomEvent('mams:data_updated', { detail: { url: config.url } }));
    window.dispatchEvent(new CustomEvent('mams:movement_updated'));
  }

  return response;
};

// Explicitly bind HTTP verb shortcuts to cached api.request
api.get = function (url, config) {
  return api.request({ ...(config || {}), method: 'get', url });
};

api.post = function (url, data, config) {
  return api.request({ ...(config || {}), method: 'post', url, data });
};

api.put = function (url, data, config) {
  return api.request({ ...(config || {}), method: 'put', url, data });
};

api.delete = function (url, config) {
  return api.request({ ...(config || {}), method: 'delete', url });
};

api.patch = function (url, data, config) {
  return api.request({ ...(config || {}), method: 'patch', url, data });
};

export { apiCache };
export default api;
