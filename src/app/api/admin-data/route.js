import { NextResponse } from "next/server";
import { adminFetch, postAdminQuery } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function cleanParts(path = "") {
  return String(path)
    .split("/")
    .filter(Boolean);
}

async function resolveDocument(path) {
  const parts = cleanParts(path);

  // websites/{websiteId}/pages/{pageType}
  if (
    parts[0] === "websites" &&
    parts[2] === "pages" &&
    parts[3]
  ) {
    const pageType = parts[3];

    if (pageType === "products") {
      const catalog = await adminFetch("/api/catalog");
      return {
        exists: true,
        id: pageType,
        data: catalog?.data ?? catalog,
      };
    }

    const response = await adminFetch(
      "/api/site-data",
      {},
      {
        type: pageType,
        pageType,
      }
    );

    return {
      exists: response !== null && response !== undefined,
      id: pageType,
      data: response?.data ?? response,
    };
  }

  // websites/{websiteId}/districts/{district}
  if (
    parts[0] === "websites" &&
    parts[2] === "districts" &&
    parts[3]
  ) {
    const district = parts[3];

    const response = await adminFetch(
      "/api/site-data",
      {},
      {
        type: "district",
        pageType: "district",
        district,
      }
    );

    return {
      exists: response !== null && response !== undefined,
      id: district,
      data: response?.data ?? response,
    };
  }

  return {
    exists: false,
    id: parts.at(-1) || "",
    data: null,
  };
}

async function resolveCollection(path) {
  const parts = cleanParts(path);

  // websites/{websiteId}/districts
  if (
    parts[0] === "websites" &&
    parts[2] === "districts" &&
    parts.length === 3
  ) {
    const response = await adminFetch(
      "/api/site-data",
      {},
      {
        type: "districts",
        pageType: "districts",
      }
    );

    const rows =
      response?.data?.districts ??
      response?.data ??
      response?.districts ??
      response;

    return {
      docs: Array.isArray(rows)
        ? rows.map((row, index) => ({
            id: row?.id || row?.slug || `district-${index}`,
            data: row,
          }))
        : [],
    };
  }

  // Generic catalog collection compatibility.
  if (
    parts.includes("products") ||
    parts.includes("items") ||
    parts.includes("categoryproducts")
  ) {
    const response = await adminFetch("/api/catalog");

    const rows =
      response?.products ??
      response?.data?.products ??
      response?.data ??
      response;

    return {
      docs: Array.isArray(rows)
        ? rows.map((row, index) => ({
            id:
              row?.id ||
              row?.uid ||
              row?.productId ||
              row?.slug ||
              `product-${index}`,
            data: row,
          }))
        : [],
    };
  }

  return { docs: [] };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get("op");
    const path = searchParams.get("path") || "";

    if (operation === "getDoc") {
      const data = await resolveDocument(path);
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=600",
        },
      });
    }

    if (operation === "getDocs") {
      const data = await resolveCollection(path);
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=600",
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid operation" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin data GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to load data",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const path = String(body?.path || "");
    const data = body?.data ?? {};
    const parts = cleanParts(path);

    // websitesQueries/{websiteId}/contactQueries
    if (
      parts[0] === "websitesQueries" &&
      parts[2] === "contactQueries"
    ) {
      const response = await postAdminQuery(
        "/api/contact-query",
        data
      );

      return NextResponse.json(
        response ?? { success: true }
      );
    }

    // websitesQueries/{websiteId}/productQueries
    if (
      parts[0] === "websitesQueries" &&
      parts[2] === "productQueries"
    ) {
      const response = await postAdminQuery(
        "/api/product-query",
        data
      );

      return NextResponse.json(
        response ?? { success: true }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unsupported Admin data collection",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin data POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to submit data",
      },
      { status: 500 }
    );
  }
}
