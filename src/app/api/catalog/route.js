import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const response = await adminFetch("/api/catalog");

    return NextResponse.json(
      response ?? { products: [] },
      {
        headers: {
          "Cache-Control":
            "public, max-age=30, s-maxage=60, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Catalog proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        products: [],
        message: error?.message || "Unable to load catalog",
      },
      { status: 502 }
    );
  }
}
