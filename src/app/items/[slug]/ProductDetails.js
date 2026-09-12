"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { fallbackProducts, makeSlug } from "@/data/productsData";
import { fetchAllDynamicProducts } from "@/lib/fetchProducts";
import {
  FaPlay,
  FaShareAlt,
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaLink,
} from "react-icons/fa";
import {
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  ShieldCheck,
  Microscope,
  HelpCircle,
  FileText,
} from "lucide-react";
import {
  doc,
  getDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const loadImageBase64 = async (src) => {
  try {
    if (!src || typeof src !== "string") {
      throw new Error("Invalid image source");
    }

    if (!src.startsWith("http")) {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          try {
            resolve(canvas.toDataURL("image/png"));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = (e) => reject(e);
        img.src = src;
      });
    }

    // Method 1: Local proxy
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("FileReader failed"));
          reader.readAsDataURL(blob);
        });
      }
    } catch (proxyErr) {
      console.warn("Proxy method failed, trying direct fetch...", proxyErr);
    }

    // Method 2: Direct fetch fallback
    try {
      const response = await fetch(src, { cache: "no-cache" });
      if (response.ok) {
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("FileReader failed"));
          reader.readAsDataURL(blob);
        });
      }
    } catch (fetchErr) {
      console.warn("fetch method failed, falling back to canvas...", fetchErr);
    }

    // Method 3: Fallback HTML Image element
    return await new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("Image element load failed"));
      img.src = src;
    });
  } catch (err) {
    console.error("loadImageBase64 failed for src:", src, err);
    throw err;
  }
};

const getProductSpecs = (product) => {
  const specsMap = new Map();

  const standardFields = [
    ["Brand", "brand"],
    ["Model", "model"],
    ["Instrument", "instrument"],
    ["Category", "category"],
    ["Capacity", "capacity"],
    ["Throughput", "throughput"],
    ["Usage", "usage"],
    ["Automation", "automation"],
    ["Availability", "availability"],
  ];

  standardFields.forEach(([label, key]) => {
    const val = product[key];
    if (val && String(val).trim() && String(val).trim() !== "N/A") {
      specsMap.set(label, String(val).trim());
    }
  });

  const blacklist = new Set([
    "title", "desc", "description", "image", "images", "slug",
    "uid", "video", "pdf", "isPublished", "category", "subCategory",
    "brand", "model", "instrument", "capacity", "throughput",
    "usage", "automation", "availability",
    "price", "categoryProductId", "category_product_id", "categoryproductid",
    "id", "createdAt", "created_at", "createdat",
  ]);

  if (product.parameters && typeof product.parameters === "string") {
    const parts = product.parameters.split("|");
    parts.forEach((part) => {
      const colonIndex = part.indexOf(":");
      if (colonIndex !== -1) {
        const label = part.substring(0, colonIndex).trim();
        const value = part.substring(colonIndex + 1).trim();
        const lowerLabel = label.toLowerCase();
        if (
          label &&
          value &&
          value !== "N/A" &&
          !blacklist.has(lowerLabel) &&
          !lowerLabel.includes("price") &&
          !lowerLabel.includes("id")
        ) {
          const cleanLabel = label.replace(/\b\w/g, (c) => c.toUpperCase());
          specsMap.set(cleanLabel, value);
        }
      }
    });
  }

  if (product.specs && typeof product.specs === "object") {
    if (Array.isArray(product.specs)) {
      product.specs.forEach((item) => {
        if (item && item.label && item.value && String(item.value).trim() !== "N/A") {
          specsMap.set(item.label, String(item.value).trim());
        }
      });
    } else {
      Object.entries(product.specs).forEach(([k, v]) => {
        if (v && String(v).trim() && String(v).trim() !== "N/A") {
          const label = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
          specsMap.set(label, String(v).trim());
        }
      });
    }
  }

  return Array.from(specsMap.entries());
};

const getWebsiteDomain = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return host;
    }
  }
  return "globalhealthcart.com";
};

export default function ProductDetails({ slug }) {
  const [product, setProduct] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedMedia, setSelectedMedia] = useState("image");
  const [showShare, setShowShare] = useState(false);
  const [contactInfo, setContactInfo] = useState([]);
  const [downloadingBrochure, setDownloadingBrochure] = useState(false);

  const shareRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const pathname = usePathname();

  const specificationsList = useMemo(() => {
    if (!product) return [];
    const list = [];
    const added = new Set();

    const addSpec = (label, val) => {
      if (val === null || val === undefined || typeof val === "object") return;
      const strVal = String(val).trim();
      if (!strVal || strVal === "N/A" || strVal.toLowerCase() === "null" || strVal.toLowerCase() === "undefined") return;
      const keyLower = label.toLowerCase().trim();
      if (!added.has(keyLower)) {
        added.add(keyLower);
        list.push({ label, value: strVal });
      }
    };

    // Standard dynamic admin fields
    if (product.brand) addSpec("Brand", product.brand);
    if (product.model) addSpec("Model", product.model);
    if (product.instrument) addSpec("Instrument", product.instrument);
    if (product.capacity) addSpec("Capacity", product.capacity);
    if (product.throughput) addSpec("Throughput", product.throughput);
    if (product.usage) addSpec("Usage / Application", product.usage);
    if (product.automation) addSpec("Automation", product.automation);
    if (product.size) addSpec("Size / Dimensions", product.size);
    if (product.availability || product.status) addSpec("Availability", product.availability || product.status);
    if (product.category) addSpec("Category", product.category);
    if (product.subCategory) addSpec("Sub Category", product.subCategory);
    if (product.categoryProductId) addSpec("Product ID", product.categoryProductId);

    // Parse parameters string if given in admin
    if (product.parameters && typeof product.parameters === "string") {
      if (product.parameters.includes("|") || product.parameters.includes(":")) {
        const parts = product.parameters.split("|");
        parts.forEach((part) => {
          const colonIndex = part.indexOf(":");
          if (colonIndex !== -1) {
            const lbl = part.substring(0, colonIndex).trim();
            const val = part.substring(colonIndex + 1).trim();
            if (lbl && val) {
              addSpec(lbl.replace(/\b\w/g, (c) => c.toUpperCase()), val);
            }
          } else if (part.trim()) {
            addSpec("Parameters", part.trim());
          }
        });
      } else {
        addSpec("Parameters", product.parameters);
      }
    }

    // Parse custom specs object if provided
    if (product.specs && typeof product.specs === "object") {
      if (Array.isArray(product.specs)) {
        product.specs.forEach((item) => {
          if (item && item.label && item.value) {
            addSpec(item.label, item.value);
          } else if (typeof item === "string" && item.includes(":")) {
            const [k, v] = item.split(":");
            addSpec(k.trim(), v.trim());
          }
        });
      } else {
        Object.entries(product.specs).forEach(([k, v]) => {
          if (v && typeof v !== "object") {
            const cleanLabel = k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
            addSpec(cleanLabel, v);
          }
        });
      }
    }

    return list;
  }, [product]);

  const pathParts = pathname.split("/").filter(Boolean);
  const city = pathParts.length > 1 ? pathParts[0] : "India";
  const cityName = city.charAt(0).toUpperCase() + city.slice(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const allProducts = await fetchAllDynamicProducts();

        let found = allProducts.find(
          (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
        );

        if (!found) {
          found = fallbackProducts.find(
            (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
          );
        }

        if (!found && fallbackProducts.length > 0) {
          const prettyTitle = slug
            ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : "Biomedical Equipment";
          found = {
            ...fallbackProducts[0],
            title: prettyTitle,
            slug: slug || "biomedical-equipment",
          };
        }

        setProduct(found);

        if (found) {
          const mainImg =
            (Array.isArray(found.images) && found.images[0]) ||
            found.image ||
            found.imgUrl ||
            found.imageUrl ||
            "/logo.png";
          setSelectedImage(mainImg);
          setSelectedMedia("image");
        }
      } catch (error) {
        console.error("Error loading product:", error);
        let found = fallbackProducts.find(
          (p) => p.slug === slug || makeSlug(p.title) === slug || p.id === slug
        );
        setProduct(found || null);
      }
    };

    loadProduct();
  }, [slug]);

  useEffect(() => {
    const loadContact = async () => {
      try {
        const snap = await getDoc(
          doc(db, "websites", "globalhealthcartcom", "pages", "contact")
        );
        if (snap.exists()) {
          setContactInfo(snap.data().contactInfo || []);
        }
      } catch (err) {
        console.error("Error loading contact info in details:", err);
      }
    };
    loadContact();
  }, []);

  const handleDownloadBrochure = async () => {
    if (!product) return;
    try {
      setDownloadingBrochure(true);
      const { jsPDF } = await import("jspdf");
      const pdfDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Load logo
      let logoBase64 = null;
      try {
        logoBase64 = await loadImageBase64("/logo.png");
      } catch (e) {
        console.error("Error loading brochure logo:", e);
      }

      // Load product image
      const imgUrl =
        product.image ||
        product.imageUrl ||
        product.imgUrl ||
        (product.images && product.images[0]);
      let productImgBase64 = null;
      if (imgUrl && imgUrl !== "/logo.png") {
        try {
          productImgBase64 = await loadImageBase64(imgUrl);
        } catch (e) {
          console.error("Error loading product image for brochure:", e);
        }
      }

      // Layout Dimensions
      const margin = 15;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - 2 * margin;

      // Theme Colors (Terracotta & Sand)
      const colorPrimary = [158, 83, 43];      // #9E532B
      const colorDark = [56, 36, 13];          // #38240D
      const colorGray = [107, 86, 69];         // #6B5645
      const colorLightBorder = [228, 210, 192];// #E4D2C0
      const colorBgWarm = [250, 245, 238];     // #FAF5EE

      // 1. HEADER
      let headerLeftOffset = margin;
      if (logoBase64) {
        try {
          pdfDoc.addImage(logoBase64, "PNG", margin, 14, 14, 14);
          headerLeftOffset += 18;
        } catch (imgErr) {
          console.warn("Could not render logo in PDF:", imgErr);
        }
      }

      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(16);
      pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdfDoc.text("Raj Biosis Private Limited", headerLeftOffset, 20);

      pdfDoc.setFont("helvetica", "normal");
      pdfDoc.setFontSize(8.5);
      pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdfDoc.text("Biomedical & Diagnostic Equipment Supplier", headerLeftOffset, 25);

      pdfDoc.setFont("helvetica", "normal");
      pdfDoc.setFontSize(8);
      pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);

      const websiteText = getWebsiteDomain();

      const phoneItems = contactInfo.filter((item) => {
        const l = (item?.label || "").toLowerCase();
        return l.includes("phone") || l.includes("mobile") || l.includes("tel") || l.includes("contact");
      });
      const rawPhones = phoneItems.flatMap((i) => (Array.isArray(i.value) ? i.value : [i.value])).filter(Boolean);
      const phoneString = rawPhones.length > 0 ? rawPhones.slice(0, 2).join(", ") : "+91 8318368383, +91 9983123469";

      const emailItem = contactInfo.find((item) => {
        const l = (item?.label || "").toLowerCase();
        return l.includes("email") || l.includes("mail");
      });
      const emailText = emailItem
        ? Array.isArray(emailItem.value)
          ? emailItem.value[0]
          : emailItem.value
        : "mail@rajbiosis.com";

      pdfDoc.text(`Website: ${websiteText}`, 135, 19);
      pdfDoc.text(`Email: ${emailText}`, 135, 24);
      pdfDoc.text(`Phone: ${phoneString}`, 135, 29);

      pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
      pdfDoc.setLineWidth(0.6);
      pdfDoc.line(margin, 34, pageWidth - margin, 34);

      // 2. PRODUCT TITLE & CATEGORY BADGE
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(8.5);
      pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdfDoc.text((product.category || "BIOMEDICAL EQUIPMENT").toUpperCase(), margin, 42);

      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(15);
      pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
      const titleLines = pdfDoc.splitTextToSize(product.title, contentWidth);
      pdfDoc.text(titleLines, margin, 48);
      const titleHeight = titleLines.length * 6.5;

      // 3. PRODUCT IMAGE
      const imageY = 48 + titleHeight + 3;
      const imageHeight = 50;
      const imageWidth = 65;
      const imageX = margin + (contentWidth - imageWidth) / 2;

      pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
      pdfDoc.setFillColor(colorBgWarm[0], colorBgWarm[1], colorBgWarm[2]);
      pdfDoc.roundedRect(imageX - 6, imageY - 2, imageWidth + 12, imageHeight + 4, 3, 3, "FD");

      if (productImgBase64) {
        let format = "JPEG";
        if (productImgBase64.startsWith("data:image/png")) {
          format = "PNG";
        }
        try {
          pdfDoc.addImage(productImgBase64, format, imageX, imageY, imageWidth, imageHeight);
        } catch (imgAddErr) {
          console.warn("PDF product image render failed:", imgAddErr);
          pdfDoc.setFont("helvetica", "normal");
          pdfDoc.setFontSize(9);
          pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
          pdfDoc.text("Diagnostic Specification Sheet", imageX + 8, imageY + imageHeight / 2);
        }
      } else {
        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.setFontSize(9.5);
        pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        pdfDoc.text("Certified Medical Equipment", imageX + 7, imageY + imageHeight / 2);
      }

      // 4. PRODUCT OVERVIEW
      const descY = imageY + imageHeight + 9;
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(11);
      pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdfDoc.text("Product Overview", margin, descY);

      pdfDoc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdfDoc.setLineWidth(0.6);
      pdfDoc.line(margin, descY + 2, margin + 28, descY + 2);

      pdfDoc.setFont("helvetica", "normal");
      pdfDoc.setFontSize(8.5);
      pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);

      let descText = product.desc || product.description || "High precision diagnostic instrument engineered for clinical accuracy.";
      if (descText.length > 350) {
        descText = descText.substring(0, 350) + "...";
      }
      const descLines = pdfDoc.splitTextToSize(descText, contentWidth);
      pdfDoc.text(descLines, margin, descY + 8);
      const descHeight = descLines.length * 4.2;

      // 5. SPECIFICATIONS
      const specsY = descY + 11 + descHeight;
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(11);
      pdfDoc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdfDoc.text("Technical Specifications", margin, specsY);

      pdfDoc.setDrawColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
      pdfDoc.setLineWidth(0.6);
      pdfDoc.line(margin, specsY + 2, margin + 38, specsY + 2);

      const specs = getProductSpecs(product);

      let specRowY = specsY + 8;
      pdfDoc.setFontSize(8);

      for (let i = 0; i < specs.length; i++) {
        const label = specs[i][0];
        const value = String(specs[i][1]);

        if (i % 2 === 0) {
          pdfDoc.setFillColor(colorBgWarm[0], colorBgWarm[1], colorBgWarm[2]);
          pdfDoc.rect(margin, specRowY - 3.5, contentWidth, 5, "F");
        }

        pdfDoc.setFont("helvetica", "bold");
        pdfDoc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        pdfDoc.text(`${label}:`, margin + 2, specRowY);

        pdfDoc.setFont("helvetica", "normal");
        pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
        const valueLines = pdfDoc.splitTextToSize(value, contentWidth - 45);
        pdfDoc.text(valueLines, margin + 42, specRowY);

        specRowY += Math.max(valueLines.length * 3.8, 5);

        if (specRowY > pageHeight - 22) {
          pdfDoc.addPage();
          specRowY = margin + 10;
        }
      }

      // 6. FOOTER
      pdfDoc.setDrawColor(colorLightBorder[0], colorLightBorder[1], colorLightBorder[2]);
      pdfDoc.setLineWidth(0.4);
      pdfDoc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      pdfDoc.setFont("helvetica", "italic");
      pdfDoc.setFontSize(7.5);
      pdfDoc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
      pdfDoc.text(
        "Raj Biosis Private Limited | NABL-Traceable Calibration • 24/7 SLA Engineering Support",
        pageWidth / 2,
        pageHeight - 9,
        { align: "center" }
      );

      pdfDoc.save(`${product.title.replace(/\s+/g, "_")}_Brochure.pdf`);
      toast.success("Brochure downloaded successfully!");
    } catch (e) {
      console.error("Error creating PDF brochure:", e);
      toast.error("Failed to generate brochure PDF.");
    } finally {
      setDownloadingBrochure(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) {
      return toast.error("Name is required");
    }

    if (!emailRegex.test(form.email)) {
      return toast.error("Enter valid email");
    }

    if (!phoneRegex.test(form.phone)) {
      return toast.error("Enter valid mobile number");
    }

    try {
      setSubmitting(true);

      await addDoc(
        collection(
          db,
          "websitesQueries",
          "globalhealthcartcom",
          "productQueries"
        ),
        {
          ...form,
          productName: product.title,
          productSlug: product.slug,
          brand: product.brand || "",
          model: product.model || "",
          createdAt: new Date(),
        }
      );

      toast.success("Your enquiry has been submitted successfully.");

      setForm({
        name: "",
        email: "",
        phone: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        image: product.image ? [product.image] : [],
        description: product.desc || product.description || product.title,
        brand: {
          "@type": "Brand",
          name: product.brand || "Raj Biosis Private Limited",
        },
      }
    : null;

  const faqSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `What is ${product.title} used for?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${product.title} is used in hospitals, pathology labs and diagnostic centres.`,
            },
          },
          {
            "@type": "Question",
            name: "Do you provide installation support?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, installation and technical support are available.",
            },
          },
        ],
      }
    : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link Copied");
    setShowShare(false);
  };

  const handleWhatsapp = () => {
    const shareText = `🔬 ${product?.title}\n\n${product?.desc || ""}\n\n🌐 ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  const handleInstagram = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard.");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.title,
        text: product.desc,
        url: window.location.href,
      });
    } else {
      setShowShare(!showShare);
    }
  };

  useEffect(() => {
    const close = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShare(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!product) {
    return (
      <section className="py-12 md:py-20 bg-[#FAF5EE]">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-[400px] md:h-[480px] rounded-3xl bg-[#F6ECE3] animate-pulse border border-[#E4D2C0]" />
            <div className="space-y-4">
              <div className="h-8 w-32 bg-[#F6ECE3] rounded-full animate-pulse" />
              <div className="h-12 w-3/4 bg-[#F6ECE3] rounded-2xl animate-pulse" />
              <div className="h-24 w-full bg-[#F6ECE3] rounded-2xl animate-pulse" />
              <div className="h-12 w-48 bg-[#F6ECE3] rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-14 bg-[#FAF5EE] text-[#38240D]">
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#6B5645]">
          <span>Home</span>
          <span>/</span>
          <a href="/items" className="hover:text-[#9E532B] transition-colors">Catalog</a>
          <span>/</span>
          <span className="text-[#9E532B] truncate max-w-xs">{product.title}</span>
        </div>

        {/* Top Section: Media (Left) & Essential Info (Right) */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Product Media (Images / Video) */}
          <div className="lg:col-span-6">
            <div className="relative h-[320px] sm:h-[400px] md:h-[460px] overflow-hidden rounded-3xl border border-[#E4D2C0] bg-white shadow-md">
              {/* Quality Badge */}
              <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#9E532B] px-3.5 py-1 text-xs font-bold !text-white shadow-sm">
                <Sparkles size={13} className="!text-white" />
                <span>Certified Clinical Quality</span>
              </div>

              {selectedMedia === "video" && product.video ? (
                <video controls autoPlay className="h-full w-full object-contain p-4">
                  <source src={product.video} type="video/mp4" />
                </video>
              ) : (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#FAF5EE] animate-pulse">
                      <div className="h-14 w-14 rounded-full border-4 border-[#E4D2C0] border-t-[#9E532B] animate-spin" />
                    </div>
                  )}

                  {(selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) &&
                  (selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])) !== "/logo.png" ? (
                    <Image
                      src={selectedImage || product.image || product.imgUrl || product.imageUrl || (Array.isArray(product.images) && product.images[0])}
                      alt={product.title || "Diagnostic Equipment"}
                      fill
                      priority
                      onLoad={() => setImageLoaded(true)}
                      className="object-contain p-6 transition-all duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#F6ECE3]/40">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FAF5EE] border border-[#E4D2C0] text-[#9E532B] shadow-sm">
                        <Microscope size={32} />
                      </div>
                      <span className="mt-3 text-xs font-bold uppercase tracking-wider text-[#7D3B17]">
                        {product.category || "Diagnostic Equipment"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Media Thumbnails */}
            <div className="mt-4 flex flex-wrap gap-3">
              {((Array.isArray(product.images) && product.images.length > 0)
                ? product.images
                : [product.image || product.imgUrl || product.imageUrl || selectedImage]
              ).filter((img) => img && img !== "/logo.png").map((img, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(img);
                    setSelectedMedia("image");
                  }}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border-2 transition-all ${
                    selectedMedia === "image" && selectedImage === img
                      ? "border-[#9E532B] shadow-md shadow-[#9E532B]/20 ring-2 ring-[#9E532B]/20"
                      : "border-[#E4D2C0] bg-white hover:border-[#9E532B]/60"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}

              {product.video && (
                <button
                  onClick={() => setSelectedMedia("video")}
                  className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                    selectedMedia === "video"
                      ? "border-[#9E532B] bg-[#F6ECE3]"
                      : "border-[#E4D2C0] bg-white hover:border-[#9E532B]"
                  }`}
                >
                  <FaPlay size={16} className="text-[#9E532B]" />
                  <span className="mt-1 text-[10px] font-bold text-[#6B5645]">Video</span>
                </button>
              )}

              {product.pdf && (
                <a
                  href={product.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-[#E4D2C0] bg-white hover:border-[#9E532B] transition-all text-[#9E532B]"
                >
                  <FileText size={18} />
                  <span className="mt-1 text-[10px] font-bold text-[#6B5645]">PDF</span>
                </a>
              )}
            </div>
          </div>

          {/* Product Header & Quick Overview */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Category and Subcategory Badges */}
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-[#9E532B]/25 bg-[#F6ECE3] px-3.5 py-1 text-xs font-bold text-[#7D3B17]">
                  {product.subCategory && product.subCategory !== product.category
                    ? `${product.category} • ${product.subCategory}`
                    : product.category || "Diagnostic Equipment"}
                </span>

                {/* Share Button */}
                <div ref={shareRef} className="relative">
                  <button
                    onClick={handleNativeShare}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4D2C0] bg-white text-[#7D3B17] shadow-sm transition-all hover:border-[#9E532B] hover:bg-[#FAF5EE] hover:text-[#9E532B]"
                    aria-label="Share Product"
                  >
                    <Share2 size={16} />
                  </button>

                  {showShare && (
                    <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-[#E4D2C0] bg-white p-2 shadow-2xl">
                      <button
                        onClick={handleCopy}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#6B5645] hover:bg-[#FAF5EE] hover:text-[#9E532B] transition-colors"
                      >
                        <FaLink className="text-[#9E532B]" /> Copy Link
                      </button>
                      <button
                        onClick={handleWhatsapp}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#6B5645] hover:bg-[#FAF5EE] hover:text-[#9E532B] transition-colors"
                      >
                        <FaWhatsapp className="text-emerald-600" /> WhatsApp
                      </button>
                      <button
                        onClick={handleFacebook}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#6B5645] hover:bg-[#FAF5EE] hover:text-[#9E532B] transition-colors"
                      >
                        <FaFacebook className="text-blue-600" /> Facebook
                      </button>
                      <button
                        onClick={handleInstagram}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#6B5645] hover:bg-[#FAF5EE] hover:text-[#9E532B] transition-colors"
                      >
                        <FaInstagram className="text-pink-600" /> Instagram
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-black leading-tight text-[#38240D]">
                {product.title}
              </h1>

              {/* Model & Brand Info */}
              {(product.brand || product.model) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6B5645]">
                  {product.brand && (
                    <span className="flex items-center gap-1.5">
                      <strong className="text-[#38240D]">Brand:</strong> {product.brand}
                    </span>
                  )}
                  {product.model && (
                    <span className="flex items-center gap-1.5">
                      <strong className="text-[#38240D]">Model:</strong> {product.model}
                    </span>
                  )}
                </div>
              )}

              {/* Quick Highlights Summary (4 key items) */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-[#E4D2C0] bg-[#F6ECE3]/50 p-3">
                  <span className="text-[11px] font-bold text-[#9E532B] uppercase tracking-wider block">Warranty</span>
                  <span className="text-xs font-bold text-[#38240D] mt-0.5 block">Comprehensive AMC Support</span>
                </div>
                <div className="rounded-xl border border-[#E4D2C0] bg-[#F6ECE3]/50 p-3">
                  <span className="text-[11px] font-bold text-[#9E532B] uppercase tracking-wider block">Calibration</span>
                  <span className="text-xs font-bold text-[#38240D] mt-0.5 block">NABL Traceable QC</span>
                </div>
                <div className="rounded-xl border border-[#E4D2C0] bg-[#F6ECE3]/50 p-3">
                  <span className="text-[11px] font-bold text-[#9E532B] uppercase tracking-wider block">Delivery</span>
                  <span className="text-xs font-bold text-[#38240D] mt-0.5 block">Pan-India Installation</span>
                </div>
                <div className="rounded-xl border border-[#E4D2C0] bg-[#F6ECE3]/50 p-3">
                  <span className="text-[11px] font-bold text-[#9E532B] uppercase tracking-wider block">Availability</span>
                  <span className="text-xs font-bold text-[#38240D] mt-0.5 block">{product.availability || product.status || "Ready to Ship"}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadBrochure}
                disabled={downloadingBrochure}
                className="group inline-flex items-center gap-2 rounded-2xl bg-[#9E532B] px-6 py-3.5 text-sm font-bold !text-white shadow-md shadow-[#9E532B]/20 transition-all hover:bg-[#7D3B17] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-75"
              >
                {downloadingBrochure ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Generating Brochure...</span>
                  </>
                ) : (
                  <>
                    <Download size={17} className="!text-white" />
                    <span>Download Brochure</span>
                  </>
                )}
              </button>

              <a
                href="#enquiry-section"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#9E532B] bg-white px-6 py-3.5 text-sm font-bold text-[#9E532B] shadow-sm transition-all hover:bg-[#FAF5EE]"
              >
                <span>Request Price Quote</span>
              </a>
            </div>
          </div>
        </div>

        {/* Lower Section: Quote Form (Sticky Left) + Details, Consolidated Specs & FAQs (Right) */}
        <div id="enquiry-section" className="mt-10 sm:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Quote Form */}
            <div className="lg:col-span-5 xl:col-span-4 rounded-3xl border border-[#E4D2C0] bg-white p-6 sm:p-7 shadow-md lg:sticky lg:top-24">
              <span className="inline-flex rounded-full bg-[#F6ECE3] px-3.5 py-1 text-xs font-bold text-[#7D3B17]">
                Instant Quotation
              </span>

              <h2 className="mt-3 text-xl sm:text-2xl font-black text-[#38240D]">
                Request A Quote
              </h2>

              <p className="mt-1.5 text-xs text-[#6B5645]">
                Enquiring for: <strong className="text-[#9E532B] font-bold">{product.title}</strong>
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#38240D] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. / Mr. / Ms."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-[#E4D2C0] bg-[#FAF5EE]/60 px-4 py-3 text-xs sm:text-sm text-[#38240D] placeholder:text-[#6B5645]/60 outline-none transition-all focus:border-[#9E532B] focus:bg-white focus:ring-2 focus:ring-[#9E532B]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38240D] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="hospital@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-[#E4D2C0] bg-[#FAF5EE]/60 px-4 py-3 text-xs sm:text-sm text-[#38240D] placeholder:text-[#6B5645]/60 outline-none transition-all focus:border-[#9E532B] focus:bg-white focus:ring-2 focus:ring-[#9E532B]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#38240D] mb-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full rounded-xl border border-[#E4D2C0] bg-[#FAF5EE]/60 px-4 py-3 text-xs sm:text-sm text-[#38240D] placeholder:text-[#6B5645]/60 outline-none transition-all focus:border-[#9E532B] focus:bg-white focus:ring-2 focus:ring-[#9E532B]/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#9E532B] py-3.5 text-sm font-bold !text-white shadow-md shadow-[#9E532B]/25 transition-all hover:bg-[#7D3B17] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 mt-2"
                >
                  {submitting ? "Submitting Inquiry..." : "Get Institutional Quote"}
                </button>
              </form>

              <div className="mt-5 border-t border-[#E4D2C0]/60 pt-4 text-center">
                <p className="text-[11px] text-[#6B5645] flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#9E532B]" /> Direct OEM warranty & calibration guaranteed
                </p>
              </div>
            </div>

            {/* Product Details, Specs (Rendered ONCE), & FAQs */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Description Card */}
              <div className="rounded-3xl border border-[#E4D2C0] bg-white p-6 sm:p-8 shadow-md">
                <span className="inline-flex rounded-full bg-[#F6ECE3] px-3.5 py-1 text-xs font-bold text-[#7D3B17]">
                  Equipment Overview
                </span>

                <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#38240D]">
                  Product Description
                </h3>

                <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#6B5645] whitespace-pre-line">
                  {product.desc || product.description || "High precision diagnostic instrument engineered for clinical accuracy and laboratory efficiency."}
                </p>
              </div>

              {/* SINGLE Technical Specifications Section */}
              {specificationsList.length > 0 && (
                <div className="rounded-3xl border border-[#E4D2C0] bg-white p-6 sm:p-8 shadow-md">
                  <span className="inline-flex rounded-full bg-[#F6ECE3] px-3.5 py-1 text-xs font-bold text-[#7D3B17]">
                    Technical Data
                  </span>

                  <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#38240D] mb-5">
                    Technical Specifications
                  </h3>

                  <div className="overflow-hidden rounded-2xl border border-[#E4D2C0]">
                    <table className="w-full border-collapse text-left">
                      <tbody>
                        {specificationsList.map((item, index) => (
                          <tr
                            key={index}
                            className="border-b border-[#E4D2C0]/60 last:border-b-0 transition-colors hover:bg-[#FAF5EE]"
                          >
                            <td className="w-2/5 bg-[#FAF5EE]/70 px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#7D3B17]">
                              {item.label}
                            </td>
                            <td className="px-4 sm:px-5 py-3 text-xs sm:text-sm font-semibold text-[#38240D] break-words">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SEO Content Accordion / Highlights */}
              <div className="rounded-3xl border border-[#E4D2C0] bg-white p-6 sm:p-8 shadow-md">
                <span className="inline-flex rounded-full bg-[#F6ECE3] px-3.5 py-1 text-xs font-bold text-[#7D3B17]">
                  Clinical Benefits
                </span>

                <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#38240D]">
                  Why Choose Raj Biosis in {cityName}?
                </h3>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: `Features of ${product.title}`,
                      content: `${product.title} provides high throughput, reliable repeatability, and intuitive digital controls.`,
                    },
                    {
                      title: `Certified Distribution in ${cityName}`,
                      content: `Raj Biosis supplies genuine instruments with turnkey installation and SLA-backed maintenance.`,
                    },
                    {
                      title: `Hospital & Lab Application`,
                      content: `Engineered for pathology chains, hospital clinical chemistry units, and research facilities.`,
                    },
                    {
                      title: `Institutional Quotations`,
                      content: `Special pricing packages available for healthcare trusts, hospital tenders, and diagnostic labs.`,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-[#E4D2C0] bg-[#FAF5EE]/50 p-4 transition-all hover:border-[#9E532B] hover:shadow-sm"
                    >
                      <h4 className="text-sm font-bold text-[#38240D]">{item.title}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-[#6B5645]">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="rounded-3xl border border-[#E4D2C0] bg-white p-6 sm:p-8 shadow-md">
                <span className="inline-flex rounded-full bg-[#F6ECE3] px-3.5 py-1 text-xs font-bold text-[#7D3B17]">
                  FAQ
                </span>

                <h3 className="mt-3 text-xl sm:text-2xl font-black text-[#38240D]">
                  Frequently Asked Questions
                </h3>

                <div className="mt-5 space-y-3">
                  {[
                    {
                      question: `What are the primary applications of ${product.title}?`,
                      answer: `${product.title} is designed for clinical chemistry, hematology, and biomedical diagnostics across pathology laboratories, hospitals, and specialized clinics.`,
                    },
                    {
                      question: `Do you offer on-site installation and engineer training in ${cityName}?`,
                      answer: `Yes, our certified biomedical engineers handle unboxing, calibration, laboratory commissioning, and comprehensive staff training on-site.`,
                    },
                    {
                      question: "What warranty and service contracts (AMC/CMC) are included?",
                      answer: "Standard warranty is provided on all instruments along with flexible Annual Maintenance Contracts (AMC) and Comprehensive Maintenance Contracts (CMC).",
                    },
                    {
                      question: "How soon can we receive delivery?",
                      answer: "In-stock equipment ships within 24 to 48 hours with secure temperature-controlled transit across India.",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-[#E4D2C0] bg-[#FAF5EE]/40 p-4 transition-all hover:border-[#9E532B]"
                    >
                      <h4 className="text-xs sm:text-sm font-bold text-[#38240D]">
                        {item.question}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-[#6B5645]">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}