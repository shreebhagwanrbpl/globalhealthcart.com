import { adminFetch } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function sitemap() {
  const baseUrl = "https://globalhealthcart.com";
  const urls = [];

  const staticPaths = [
    "",
    "/about",
    "/services",
    "/contact",
    "/items",
  ];

  for (const path of staticPaths) {
    urls.push({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
    });
  }

  try {
    const districtResponse = await adminFetch(
      "/api/site-data",
      {},
      {
        type: "districts",
        pageType: "districts",
      }
    );

    const districts =
      districtResponse?.data?.districts ??
      districtResponse?.data ??
      districtResponse?.districts ??
      districtResponse;

    const safeDistricts =
      Array.isArray(districts)
        ? districts.filter(
            (district) =>
              district?.slug
          )
        : [];

    for (const district of safeDistricts) {
      const slug = district.slug;

      for (const path of staticPaths) {
        urls.push({
          url: `${baseUrl}/${slug}${path}`,
          lastModified: new Date(),
        });
      }
    }

    const catalog =
      await adminFetch("/api/catalog");

    const products =
      catalog?.products ??
      catalog?.data?.products ??
      catalog?.data ??
      catalog;

    if (Array.isArray(products)) {
      for (const product of products) {
        if (!product?.slug) continue;

        urls.push({
          url: `${baseUrl}/items/${product.slug}`,
          lastModified: new Date(),
        });

        for (const district of safeDistricts) {
          urls.push({
            url:
              `${baseUrl}/${district.slug}` +
              `/items/${product.slug}`,
            lastModified: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.error(
      "Sitemap Admin API error:",
      error
    );
  }

  // Remove accidental duplicates.
  const unique = new Map();

  for (const item of urls) {
    unique.set(item.url, item);
  }

  return Array.from(unique.values());
}
