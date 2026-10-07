"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Microscope,
} from "lucide-react";
import { makeSlug } from "@/data/productsData";

export default function ProductCard({
  product,
  makeLink = (p) => p,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // --------------------------------------------------
  // Product Data
  // --------------------------------------------------
  const {
    id,
    title,
    category,
    subCategory,
    description,
    desc,
    specs = {},
    badge,
    status,
    availability,
    image,
    slug,
    brand,
    model,
    throughput,
    capacity,
    instrument,
    automation,
    usage,
    price,
  } = product || {};

  // --------------------------------------------------
  // Product Slug
  // --------------------------------------------------
  const productSlug =
    slug || (title ? makeSlug(title) : id || "product");

  const pdpLink = makeLink(`/items/${productSlug}`);

  // --------------------------------------------------
  // Description
  // --------------------------------------------------
  const displayDesc = desc || description || "";

  // --------------------------------------------------
  // Display Image
  // --------------------------------------------------
  const hasProductImage =
    typeof image === "string" &&
    image.trim() !== "" &&
    image !== "/logo.png";

  const displayImage =
    hasProductImage && !imgError ? image : null;

  const hasValidImage = Boolean(displayImage);

  // --------------------------------------------------
  // Status
  // --------------------------------------------------
  const displayStatus =
    status || availability || "In Stock";

  // --------------------------------------------------
  // Dynamic Specifications
  // --------------------------------------------------
  const dynamicSpecs = useMemo(() => {
    const combinedSpecs = {
      ...specs,

      // Add common product-level specifications
      ...(brand ? { Brand: brand } : {}),
      ...(model ? { Model: model } : {}),
      ...(throughput ? { Throughput: throughput } : {}),
      ...(capacity ? { Capacity: capacity } : {}),
      ...(instrument ? { Instrument: instrument } : {}),
      ...(automation ? { Automation: automation } : {}),
      ...(usage ? { Usage: usage } : {}),
    };

    // Remove empty / null / undefined values
    const cleanedSpecs = Object.entries(combinedSpecs).filter(
      ([key, value]) =>
        key &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    );

    return cleanedSpecs;
  }, [
    specs,
    brand,
    model,
    throughput,
    capacity,
    instrument,
    automation,
    usage,
  ]);

  // --------------------------------------------------
  // Format Specification Key
  // --------------------------------------------------
  const formatSpecKey = (key) => {
    if (!key) return "";

    return String(key)
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // --------------------------------------------------
  // Format Specification Value
  // --------------------------------------------------
  const formatSpecValue = (value) => {
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    if (typeof value === "object" && value !== null) {
      return Object.values(value).join(", ");
    }

    return String(value);
  };

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E4D2C0] bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#9E532B]/50 hover:shadow-2xl hover:shadow-[#9E532B]/15">
      <div>
        {/* ==================================================
            IMAGE CONTAINER
        ================================================== */}
        <Link
          href={pdpLink}
          className="relative block h-60 w-full overflow-hidden border-b border-[#E4D2C0]/50 bg-gradient-to-b from-[#FAF5EE] to-white p-4"
        >
          {hasValidImage ? (
            <>
              {/* Loading Skeleton */}
              {!imgLoaded && (
                <div className="absolute inset-0 z-0 flex flex-col items-center justify-center animate-pulse bg-gradient-to-br from-[#F5ECE1] via-[#FAF5EE] to-[#EFE1D2]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E4D2C0] bg-white/90 text-[#9E532B] shadow-sm">
                    <Microscope
                      size={24}
                      className="text-[#9E532B]"
                    />
                  </div>
                </div>
              )}

              <Image
                src={displayImage}
                alt={title || "Biomedical Equipment"}
                fill
                quality={80}
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  setImgError(true);
                  setImgLoaded(false);
                }}
                className={`object-contain p-2 transition-all duration-300 group-hover:scale-105 ${imgLoaded
                  ? "scale-100 opacity-100"
                  : "scale-[0.98] opacity-90"
                  }`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
              />
            </>
          ) : (
            /* ==================================================
               PREMIUM PLACEHOLDER
            ================================================== */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF5EE] via-[#F5ECE1] to-[#EFE1D2] p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[#E4D2C0] bg-white text-[#9E532B] shadow-md transition-transform duration-300 group-hover:scale-110">
                <Microscope size={32} />
              </div>

              <span className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#38240D]">
                {category || "Diagnostic Equipment"}
              </span>

              <span className="mt-0.5 text-[10px] font-semibold text-[#6B5645]">
                Certified Specification
              </span>
            </div>
          )}

          {/* ==================================================
              BADGES
          ================================================== */}
          <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
            {badge ? (
              <span className="max-w-[150px] truncate rounded-full border border-[#9E532B]/30 bg-white/95 px-3 py-1 text-xs font-extrabold text-[#9E532B] shadow-sm backdrop-blur-md">
                {badge}
              </span>
            ) : (
              <span className="max-w-[150px] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#38240D] shadow-sm backdrop-blur-md">
                {subCategory || category || "Equipment"}
              </span>
            )}

            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#9E532B] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              <ShieldCheck size={12} />
              {displayStatus}
            </span>
          </div>
        </Link>

        {/* ==================================================
            PRODUCT DETAILS
        ================================================== */}
        <div className="p-6">
          {/* Category */}
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold uppercase tracking-wider text-[#9E532B]">
              {subCategory && subCategory !== category
                ? `${category || "Equipment"} • ${subCategory}`
                : category || "Biomedical Equipment"}
            </span>
          </div>

          {/* Product Title */}
          <Link
            href={pdpLink}
            className="mt-1.5 block"
          >
            <h3 className="line-clamp-2 text-xl font-bold leading-tight text-[#38240D] transition-colors group-hover:text-[#9E532B]">
              {title || "Biomedical Equipment"}
            </h3>
          </Link>

          {/* Description */}
          {displayDesc && (
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[#6B5645]">
              {displayDesc}
            </p>
          )}

          {/* ==================================================
              DYNAMIC SPECS
          ================================================== */}
          {dynamicSpecs.length > 0 && (
            <div className="mt-4 space-y-1.5 rounded-2xl border border-[#E4D2C0] bg-[#F6ECE3] p-3 text-xs text-[#6B5645]">
              {dynamicSpecs
                .slice(0, 3)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="shrink-0 font-bold text-[#38240D]">
                      {formatSpecKey(key)}:
                    </span>

                    <span className="max-w-[170px] truncate font-semibold text-[#9E532B]">
                      {formatSpecValue(value)}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* ==================================================
              PRICE - OPTIONAL
          ================================================== */}
          {price && (
            <div className="mt-4">
              <span className="text-sm font-semibold text-[#6B5645]">
                Price
              </span>

              <div className="text-lg font-extrabold text-[#9E532B]">
                {price}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          CARD FOOTER
      ================================================== */}
      <div className="mt-2 flex items-center gap-3 p-6 pt-0">
        <Link
          href={pdpLink}
          className="group/btn flex w-full items-center justify-center gap-2 rounded-2xl bg-[#9E532B] py-3 text-center text-sm font-bold !text-white shadow-md transition-all hover:bg-[#7D3B17] hover:shadow-lg"
        >
          <span className="text-sm font-bold tracking-wide !text-white">
            Inquire Price & Specs
          </span>

          <ArrowRight
            size={16}
            className="shrink-0 !text-white transition-transform group-hover/btn:translate-x-1"
          />
        </Link>
      </div>
    </div>
  );
}