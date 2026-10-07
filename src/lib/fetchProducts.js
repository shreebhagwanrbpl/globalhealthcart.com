import { makeSlug } from "@/data/productsData";
import { fetchFullCatalog, getSyncCatalog } from "@/lib/data-fetcher";

export function normalizeProduct(
  item,
  defaultCategory = "Diagnostic Equipment"
) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const title = (
    item.title ||
    item.name ||
    item.productName ||
    item.itemName ||
    ""
  ).trim();

  if (!title) return null;

  const rawSlug =
    item.slug ||
    item.productSlug ||
    item.itemSlug ||
    makeSlug(title);

  const category =
    item.category ||
    item.categoryName ||
    defaultCategory ||
    "Diagnostic Equipment";

  const subCategory =
    item.subCategory ||
    item.subcategory ||
    item["sub category"] ||
    item.subCategoryName ||
    "";

  const description =
    item.desc ||
    item.description ||
    item.detail ||
    item.summary ||
    "";

  const images =
    Array.isArray(item.images) &&
    item.images.length
      ? item.images
      : item.image
        ? [item.image]
        : item.imageUrl
          ? [item.imageUrl]
          : item.imgUrl
            ? [item.imgUrl]
            : [];

  const image =
    item.image ||
    images[0] ||
    item.imageUrl ||
    item.imgUrl ||
    "";

  const features =
    Array.isArray(item.features)
      ? item.features.filter(Boolean)
      : typeof item.features === "string"
        ? item.features
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];

  return {
    ...item,

    id:
      item.uid ||
      item.id ||
      item.productId ||
      item.categoryProductId ||
      rawSlug,

    categoryProductId:
      item.categoryProductId || "",

    title,
    name: title,
    slug: rawSlug,

    category,
    subCategory,

    description,
    desc: description,

    price: item.price || "",
    capacity: item.capacity || "",
    throughput: item.throughput || "",
    instrument: item.instrument || "",
    model: item.model || "",
    usage: item.usage || "",
    brand: item.brand || "",
    parameters: item.parameters || "",
    automation: item.automation || "",
    availability:
      item.availability ||
      item.status ||
      "",
    size: item.size || "",

    features,

    specs:
      item.specs &&
      typeof item.specs === "object"
        ? item.specs
        : null,

    badge:
      item.badge ||
      item.tag ||
      "",

    status:
      item.status ||
      item.availability ||
      "In Stock",

    image,
    images: images.length > 0 ? images : image ? [image] : [],

    video: item.video || "",
    pdf: item.pdf || "",

    isPublished:
      item.isPublished !== false,
  };
}

export function getSyncProducts() {
  const raw = getSyncCatalog();
  return Array.isArray(raw)
    ? raw.map((item) => normalizeProduct(item)).filter(Boolean)
    : [];
}

export async function fetchAllDynamicProducts() {
  const products =
    await fetchFullCatalog();

  return Array.isArray(products)
    ? products
        .map((item) =>
          normalizeProduct(item)
        )
        .filter(Boolean)
    : [];
}
