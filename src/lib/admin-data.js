// Browser-safe compatibility layer backed by the central Admin MongoDB API.
// It intentionally keeps the old doc()/collection()/getDoc()/addDoc() calling
// convention so existing UI imports do not need to lose functionality.

const DB_MARKER = Symbol("admin-api-db");

export const db = {
  [DB_MARKER]: true,
};

// Client-side Memory + Storage SWR Cache
const adminDataMemCache = new Map();
const FRESH_TTL = 60 * 1000; // 1 minute fresh
const STALE_TTL = 15 * 60 * 1000; // 15 minutes stale retention

function getStorage(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`ghc_ad_${key}`);
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
      `ghc_ad_${key}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }
}

function normalizePath(parts) {
  return parts
    .flatMap((part) => String(part || "").split("/"))
    .filter(Boolean)
    .join("/");
}

export function doc(...parts) {
  return {
    type: "doc",
    path: normalizePath(parts),
  };
}

export function collection(...parts) {
  return {
    type: "collection",
    path: normalizePath(parts),
  };
}

async function request(url, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const now = Date.now();

  if (isGet) {
    if (adminDataMemCache.has(url)) {
      const entry = adminDataMemCache.get(url);
      if (now - entry.timestamp < FRESH_TTL) {
        return entry.data;
      }
      // Revalidate in background
      void executeFetch(url, options);
      return entry.data;
    }

    const stored = getStorage(url);
    if (stored) {
      adminDataMemCache.set(url, { data: stored, timestamp: now });
      void executeFetch(url, options);
      return stored;
    }
  }

  return executeFetch(url, options);
}

async function executeFetch(url, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let body = null;

    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok || body?.success === false) {
      const message =
        typeof body === "string" ? body : JSON.stringify(body);
      throw new Error(`Admin website API ${response.status}: ${message}`);
    }

    if (isGet && body) {
      adminDataMemCache.set(url, { data: body, timestamp: Date.now() });
      setStorage(url, body);
    }

    return body;
  } catch (err) {
    if (isGet) {
      const stored = getStorage(url);
      if (stored) return stored;
    }
    throw err;
  }
}

export async function getDoc(reference) {
  const path = reference?.path || "";
  const params = new URLSearchParams({
    op: "getDoc",
    path,
  });

  const url = `/api/admin-data?${params.toString()}`;
  const result = await request(url);

  return {
    exists: () => result?.exists === true,
    data: () => result?.data ?? null,
    id: result?.id || "",
  };
}

export async function getDocs(reference) {
  const path = reference?.path || "";
  const params = new URLSearchParams({
    op: "getDocs",
    path,
  });

  const url = `/api/admin-data?${params.toString()}`;
  const result = await request(url);
  const rows = Array.isArray(result?.docs) ? result.docs : [];

  const docs = rows.map((row, index) => ({
    id: row?.id || `item-${index}`,
    data: () => row?.data ?? row ?? {},
  }));

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
  };
}

export async function addDoc(reference, data = {}) {
  return request("/api/admin-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "addDoc",
      path: reference?.path || "",
      data,
    }),
  });
}

// Firestore-style realtime listener replacement.
// It performs an immediate fetch and then refreshes periodically.
// The returned function always stops the listener.
export function onSnapshot(reference, onNext, onError) {
  let stopped = false;
  let timer = null;

  const run = async () => {
    try {
      const snapshot =
        reference?.type === "collection"
          ? await getDocs(reference)
          : await getDoc(reference);

      if (!stopped) {
        onNext?.(snapshot);
      }
    } catch (error) {
      if (!stopped) {
        onError?.(error);
      }
    }
  };

  void run();

  timer = setInterval(run, 30000);

  return () => {
    stopped = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
