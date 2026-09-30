/**
 * MAMS High-Performance In-Memory & Session API Caching Layer
 * Provides instant 0ms responses for cached endpoints, Single-Flight deduplication,
 * and automatic cache eviction on mutations.
 */

const CACHE_PREFIX = 'mams_cache_';
const DEFAULT_TTL_MS = 60 * 1000; // 1 minute default for dynamic endpoints
const LOOKUP_TTL_MS = 5 * 60 * 1000; // 5 minutes for stable reference data (bases, equipment)

// In-Memory store for microsecond-fast lookups during a session
const memoryStore = new Map();

// Single-Flight Request Deduplication map (combines concurrent identical requests into one)
const pendingRequests = new Map();

/**
 * Determine custom TTL based on endpoint pattern
 */
const getTtlForUrl = (url) => {
  if (url.includes('/bases') || url.includes('/equipment')) {
    return LOOKUP_TTL_MS;
  }
  return DEFAULT_TTL_MS;
};

/**
 * Generate unique cache key from Axios request config
 */
export const generateCacheKey = (config) => {
  const method = (config.method || 'get').toLowerCase();
  const url = (config.url || '').replace(/^\/+/, '');
  let paramsString = '';

  if (config.params) {
    try {
      const sortedKeys = Object.keys(config.params).sort();
      paramsString = '?' + sortedKeys.map(k => `${k}=${config.params[k]}`).join('&');
    } catch {
      paramsString = '?' + JSON.stringify(config.params);
    }
  }

  return `${method}:${url}${paramsString}`;
};

export const apiCache = {
  /**
   * Get cached data if valid and not expired
   */
  get(key) {
    // 1. Check memory store
    const memEntry = memoryStore.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiry) {
        return { data: memEntry.data, isStale: false };
      }
      // Expired in memory
      memoryStore.delete(key);
    }

    // 2. Check sessionStorage fallback
    try {
      const raw = sessionStorage.getItem(CACHE_PREFIX + key);
      if (raw) {
        const entry = JSON.parse(raw);
        if (Date.now() < entry.expiry) {
          // Restore to memory store for faster next lookup
          memoryStore.set(key, entry);
          return { data: entry.data, isStale: false };
        }
        sessionStorage.removeItem(CACHE_PREFIX + key);
      }
    } catch (e) {
      // sessionStorage might be disabled or full
    }

    return null;
  },

  /**
   * Save response data into cache with TTL
   */
  set(key, data, customTtl) {
    if (!data) return;
    const ttl = customTtl || getTtlForUrl(key);
    const entry = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    };

    // Save in memory
    memoryStore.set(key, entry);

    // Persist in session
    try {
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      // Ignore sessionStorage storage limit exceptions
    }
  },

  /**
   * Check if a valid cache entry exists
   */
  has(key) {
    return !!this.get(key);
  },

  /**
   * Invalidate specific keys or patterns
   */
  invalidate(pattern) {
    const isString = typeof pattern === 'string';
    const regex = isString ? new RegExp(pattern.replace(/\//g, '\\/'), 'i') : pattern;

    // Clear matching from memory
    for (const key of memoryStore.keys()) {
      if (regex.test(key)) {
        memoryStore.delete(key);
      }
    }

    // Clear matching from sessionStorage
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const sKey = sessionStorage.key(i);
        if (sKey && sKey.startsWith(CACHE_PREFIX)) {
          const stripped = sKey.replace(CACHE_PREFIX, '');
          if (regex.test(stripped)) {
            keysToRemove.push(sKey);
          }
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      // Ignore
    }
  },

  /**
   * Invalidate cache on mutations (POST/PUT/DELETE/PATCH)
   */
  invalidateForMutation(url) {
    if (!url) return;
    const cleanUrl = url.toLowerCase();

    if (cleanUrl.includes('movement') || cleanUrl.includes('purchase') || cleanUrl.includes('transfer') || cleanUrl.includes('assign') || cleanUrl.includes('expend') || cleanUrl.includes('return')) {
      this.invalidate('movements');
      this.invalidate('inventory');
      this.invalidate('dashboard');
      this.invalidate('reports');
    } else if (cleanUrl.includes('base')) {
      this.invalidate('bases');
      this.invalidate('inventory');
      this.invalidate('dashboard');
      this.invalidate('reports');
      this.invalidate('personnel');
    } else if (cleanUrl.includes('equipment')) {
      this.invalidate('equipment');
      this.invalidate('inventory');
      this.invalidate('dashboard');
      this.invalidate('reports');
    } else if (cleanUrl.includes('personnel') || cleanUrl.includes('user') || cleanUrl.includes('auth')) {
      this.invalidate('personnel');
      this.invalidate('users');
    } else if (cleanUrl.includes('inventory')) {
      this.invalidate('inventory');
      this.invalidate('dashboard');
      this.invalidate('reports');
    } else {
      // General invalidation
      this.invalidate('dashboard');
      this.invalidate('reports');
    }
  },

  /**
   * Clear entire cache (useful on Logout or full Hard Refresh)
   */
  clearAll() {
    memoryStore.clear();
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const sKey = sessionStorage.key(i);
        if (sKey && sKey.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(sKey);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch (e) {
      // Ignore
    }
  },

  // Single-Flight in-flight tracker
  hasPending(key) {
    return pendingRequests.has(key);
  },

  getPending(key) {
    return pendingRequests.get(key);
  },

  setPending(key, promise) {
    pendingRequests.set(key, promise);
  },

  removePending(key) {
    pendingRequests.delete(key);
  },
};

export default apiCache;
