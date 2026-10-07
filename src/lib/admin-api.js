import "server-only";

import { WEBSITE_ID, COMPANY_ID } from "./catalog-utils";

export const ADMIN_API_BASE_URL = (
  process.env.ADMIN_API_BASE_URL ||
  process.env.ADMIN_API_URL ||
  "https://admin.rajbiosis.app"
).replace(/\/+$/, "");

function buildUrl(pathname, params = {}) {
  const path = String(pathname || "");
  const url = new URL(
    `${ADMIN_API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
  );

  const query = {
    websiteId: WEBSITE_ID,
    companyId: COMPANY_ID,
    ...params,
  };

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

// Server-side in-memory cache for ultra-fast instant responses
const serverCache = new Map();
const CACHE_FRESH_MS = 60 * 1000; // 1 minute fresh
const CACHE_MAX_MS = 15 * 60 * 1000; // 15 minutes stale retention

export async function adminFetch(pathname, options = {}, params = {}) {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const urlObj = buildUrl(pathname, params);
  const cacheKey = urlObj.toString();

  // Check cache for GET requests
  if (isGet && serverCache.has(cacheKey)) {
    const entry = serverCache.get(cacheKey);
    const age = Date.now() - entry.timestamp;

    // If still fresh, return immediately (<1ms)
    if (age < CACHE_FRESH_MS) {
      return entry.data;
    }

    // If stale but within max retention, trigger background revalidation and return stale data immediately
    if (age < CACHE_MAX_MS) {
      // Revalidate in background asynchronously
      fetchRemote(urlObj, options)
        .then((freshData) => {
          serverCache.set(cacheKey, { data: freshData, timestamp: Date.now() });
        })
        .catch((err) => {
          console.warn(`Background revalidation failed for ${cacheKey}:`, err.message);
        });

      return entry.data;
    }
  }

  // Fetch from remote
  const data = await fetchRemote(urlObj, options);

  if (isGet && data) {
    serverCache.set(cacheKey, { data, timestamp: Date.now() });
  }

  return data;
}

async function fetchRemote(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const response = await fetch(url.toString(), {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let body = null;

    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok || body?.success === false || body?.ok === false) {
      const message =
        typeof body === "string" ? body : JSON.stringify(body);
      throw new Error(`Admin API ${response.status}: ${message}`);
    }

    return body;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function postAdminQuery(endpoint, payload = {}) {
  return adminFetch(
    endpoint,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        websiteId: WEBSITE_ID,
        companyId: COMPANY_ID,
        ...payload,
      }),
    },
    {}
  );
}

export async function fetchCatalogFromAdmin() {
  const response = await adminFetch("/api/catalog");
  const products =
    response?.products ??
    response?.data?.products ??
    response?.data ??
    response;

  return Array.isArray(products) ? products : [];
}

export { buildUrl };
