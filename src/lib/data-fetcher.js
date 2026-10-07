import { makeSlug } from "./catalog-utils";
import { fallbackProducts } from "@/data/productsData";

const SITE_ID = "globalhealthcartcom";

// Client-side Memory + Storage SWR Cache
const memCache = new Map();
let cachedCatalog = null;
let lastCatalogFetchTime = 0;
const FRESH_TTL = 60 * 1000; // 1 minute fresh
const STALE_TTL = 15 * 60 * 1000; // 15 minutes stale retention

function getStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`ghc_cache_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Date.now() - parsed.timestamp < STALE_TTL) {
      return parsed.data;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function setStorage(key, data) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `ghc_cache_${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage write errors (e.g. quota)
  }
}

export function getSyncCatalog() {
  if (cachedCatalog && cachedCatalog.length > 0) {
    return cachedCatalog;
  }
  const fromStorage = getStorage("catalog");
  if (Array.isArray(fromStorage) && fromStorage.length > 0) {
    cachedCatalog = fromStorage;
    return fromStorage;
  }
  return fallbackProducts;
}

export function getSyncPage(pageType) {
  const cacheKey = `page_${pageType}`;
  if (memCache.has(cacheKey)) {
    return memCache.get(cacheKey).data;
  }
  return getStorage(cacheKey);
}

async function fetchSitePage(pageType) {
  const cacheKey = `page_${pageType}`;
  const now = Date.now();

  // 1. Check memory cache
  if (memCache.has(cacheKey)) {
    const entry = memCache.get(cacheKey);
    if (now - entry.timestamp < FRESH_TTL) {
      return entry.data;
    }
    // Stale: trigger background fetch and return immediately
    void fetchSitePageRemote(pageType);
    return entry.data;
  }

  // 2. Check session storage
  const storageData = getStorage(cacheKey);
  if (storageData) {
    memCache.set(cacheKey, { data: storageData, timestamp: now });
    void fetchSitePageRemote(pageType);
    return storageData;
  }

  return fetchSitePageRemote(pageType);
}

async function fetchSitePageRemote(pageType) {
  const cacheKey = `page_${pageType}`;
  try {
    const response = await fetch(
      `/api/admin-data?op=getDoc&path=${encodeURIComponent(
        `websites/${SITE_ID}/pages/${pageType}`
      )}`
    );

    if (!response.ok) {
      throw new Error(`Unable to load ${pageType}: ${response.status}`);
    }

    const result = await response.json();
    const data = result?.exists ? result.data : null;

    if (data) {
      memCache.set(cacheKey, { data, timestamp: Date.now() });
      setStorage(cacheKey, data);
    }

    return data;
  } catch (err) {
    console.warn(`Error fetching ${pageType}:`, err.message);
    const cached = getStorage(cacheKey);
    return cached || null;
  }
}

export async function fetchDocCached(path) {
  if (!path) return null;
  const now = Date.now();

  if (memCache.has(path)) {
    const entry = memCache.get(path);
    if (now - entry.timestamp < FRESH_TTL) {
      return entry.data;
    }
    // Background refresh
    void fetchDocRemote(path);
    return entry.data;
  }

  const storageData = getStorage(path);
  if (storageData) {
    memCache.set(path, { data: storageData, timestamp: now });
    void fetchDocRemote(path);
    return storageData;
  }

  return fetchDocRemote(path);
}

async function fetchDocRemote(path) {
  try {
    const response = await fetch(
      `/api/admin-data?op=getDoc&path=${encodeURIComponent(path)}`
    );

    if (!response.ok) {
      throw new Error(`Admin data ${response.status}`);
    }

    const result = await response.json();
    const data = result?.exists ? result.data : null;

    if (data) {
      memCache.set(path, { data, timestamp: Date.now() });
      setStorage(path, data);
    }

    return data;
  } catch (err) {
    console.warn(`Error fetching doc ${path}:`, err.message);
    const cached = getStorage(path);
    return cached || null;
  }
}

function normalizeProduct(item = {}, category = "", subCategory = "") {
  if (!item || typeof item !== "object") return null;

  const title =
    item.title ||
    item.name ||
    item.productName ||
    item.itemName ||
    "";

  if (!String(title).trim()) return null;

  const slug =
    item.slug ||
    item.productSlug ||
    makeSlug(title);

  const images =
    Array.isArray(item.images) && item.images.length
      ? item.images
      : item.image
        ? [item.image]
        : item.imageUrl
          ? [item.imageUrl]
          : item.imgUrl
            ? [item.imgUrl]
            : [];

  const image = item.image || images[0] || item.imageUrl || item.imgUrl || "";

  return {
    ...item,
    id:
      item.id ||
      item.uid ||
      item.productId ||
      item.categoryProductId ||
      slug,

    uid:
      item.uid ||
      item.id ||
      item.productId ||
      slug,

    productId:
      item.productId ||
      item.id ||
      item.uid ||
      slug,

    title: String(title).trim(),
    name: String(title).trim(),
    slug,

    category:
      item.category ||
      item.categoryName ||
      category ||
      "Diagnostic Equipment",

    subCategory:
      item.subCategory ||
      item.subcategory ||
      item.subCategoryName ||
      subCategory ||
      category ||
      "General",

    description:
      item.description ||
      item.desc ||
      item.detail ||
      item.summary ||
      "",

    desc:
      item.desc ||
      item.description ||
      item.detail ||
      item.summary ||
      "",

    image,
    images: images.length > 0 ? images : image ? [image] : [],

    features:
      Array.isArray(item.features)
        ? item.features.filter(Boolean)
        : typeof item.features === "string"
          ? item.features
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean)
          : [],

    isPublished:
      item.isPublished !== false,
  };
}

function extractProducts(response) {
  const rows =
    response?.products ??
    response?.data?.products ??
    response?.data ??
    response;

  return Array.isArray(rows) ? rows : [];
}

let inFlightCatalogPromise = null;

export async function fetchFullCatalog() {
  const now = Date.now();

  // If we already have fresh cached catalog in memory, return immediately (<1ms)
  if (cachedCatalog && cachedCatalog.length > 0 && now - lastCatalogFetchTime < FRESH_TTL) {
    return cachedCatalog;
  }

  // If stale catalog exists, return it immediately and revalidate in background
  if (cachedCatalog && cachedCatalog.length > 0 && now - lastCatalogFetchTime < STALE_TTL) {
    void executeFetchCatalog();
    return cachedCatalog;
  }

  // Check storage
  const storageData = getStorage("catalog");
  if (Array.isArray(storageData) && storageData.length > 0) {
    cachedCatalog = storageData;
    lastCatalogFetchTime = now;
    void executeFetchCatalog();
    return storageData;
  }

  if (inFlightCatalogPromise) {
    return inFlightCatalogPromise;
  }

  inFlightCatalogPromise = executeFetchCatalog().finally(() => {
    inFlightCatalogPromise = null;
  });

  return inFlightCatalogPromise;
}

async function executeFetchCatalog() {
  try {
    const response = await fetch("/api/catalog");
    if (!response.ok) {
      throw new Error(`Catalog API ${response.status}`);
    }

    const data = await response.json();
    const rawProducts = extractProducts(data)
      .filter((item) => item && item.isPublished !== false)
      .map((item) =>
        normalizeProduct(
          item,
          item.category || "",
          item.subCategory || item.subcategory || ""
        )
      )
      .filter(Boolean);

    // If API returned valid products, deduplicate & cache
    if (rawProducts.length > 0) {
      const map = new Map();
      for (const product of rawProducts) {
        const key = product.slug || product.productId || product.id;
        if (!map.has(key)) {
          map.set(key, product);
        }
      }
      cachedCatalog = Array.from(map.values());
    } else if (!cachedCatalog) {
      cachedCatalog = fallbackProducts.map((p) => normalizeProduct(p));
    }

    lastCatalogFetchTime = Date.now();
    setStorage("catalog", cachedCatalog);
    return cachedCatalog;
  } catch (error) {
    console.warn("Catalog fetch failed, using fallback/cached:", error.message);
    if (!cachedCatalog || cachedCatalog.length === 0) {
      cachedCatalog = fallbackProducts.map((p) => normalizeProduct(p));
    }
    return cachedCatalog;
  }
}

export async function fetchHomeData() {
  return fetchSitePage("home");
}

export async function fetchContactData() {
  return fetchSitePage("contact");
}

export async function fetchServicesData() {
  return fetchSitePage("services");
}

export async function fetchDistrictData(district) {
  if (!district) return null;
  const path = `websites/${SITE_ID}/districts/${district}`;
  return fetchDocCached(path);
}

export async function fetchDistricts() {
  const path = `websites/${SITE_ID}/districts`;
  const cached = memCache.get(path);
  if (cached && Date.now() - cached.timestamp < FRESH_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `/api/admin-data?op=getDocs&path=${encodeURIComponent(path)}`
    );

    if (!response.ok) {
      throw new Error(`District API ${response.status}`);
    }

    const result = await response.json();
    const rows = Array.isArray(result?.docs)
      ? result.docs.map((item, index) => ({
          ...(item?.data || {}),
          id:
            item?.id ||
            item?.data?.id ||
            item?.data?.slug ||
            `district-${index}`,
          slug:
            item?.data?.slug ||
            item?.data?.id ||
            makeSlug(
              item?.data?.district ||
              item?.data?.name ||
              `district-${index}`
            ),
        }))
      : [];

    memCache.set(path, { data: rows, timestamp: Date.now() });
    return rows;
  } catch (err) {
    console.warn("Failed fetching districts:", err.message);
    return cached ? cached.data : [];
  }
}

export function subscribeToCatalog(onUpdate) {
  let stopped = false;
  let timer = null;

  const load = async () => {
    try {
      const products = await fetchFullCatalog();
      if (!stopped) {
        onUpdate?.(products);
      }
    } catch (error) {
      if (!stopped) {
        console.error("Admin catalog subscription error:", error);
      }
    }
  };

  void load();
  timer = setInterval(load, 30000);

  return () => {
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
