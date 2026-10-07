export const WEBSITE_ID = "globalhealthcartcom";
export const COMPANY_ID = "rajbiosis";

export function makeSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isItemVisibleOnWebsite(item = {}, websiteId = WEBSITE_ID) {
  if (!item || item.isPublished === false) return false;

  const ids = [
    item.websiteId,
    item.websiteID,
    item.siteId,
  ].filter(Boolean);

  if (!ids.length) return true;

  return ids.map(String).includes(String(websiteId));
}
