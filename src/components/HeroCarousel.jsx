"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Film,
  Layers,
} from "lucide-react";

// High-quality fallback slides if database has no media configured yet
const FALLBACK_SLIDES = [
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1900&q=80",
    badge: "Clinical Analyzers",
    caption: "Automated Chemistry & Hematology Systems",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1900&q=80",
    badge: "Diagnostic Excellence",
    caption: "High-Throughput Pathology Equipment",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1900&q=80",
    badge: "24/7 SLA Engineering",
    caption: "Certified Calibration & Turnkey Lab Setup",
  },
];

export default function HeroCarousel({
  homeData = null,
  locationTitle = "",
  makeLink = (path) => path,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const videoRefs = useRef({});

  // Parse media items from Firestore home data
  const parseMediaList = (data) => {
    if (!data) return [];
    const list = [];

    // 1. Check media array (preferred)
    if (Array.isArray(data.media) && data.media.length > 0) {
      data.media.forEach((item, idx) => {
        const url = typeof item === "string" ? item : item?.url;
        const type =
          item?.type ||
          (url?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? "video" : "image");
        if (url) {
          list.push({
            id: `media-${idx}`,
            type,
            url,
            badge: item?.badge || item?.title || `Equipment 0${idx + 1}`,
            caption: item?.caption || item?.subtitle || "",
          });
        }
      });
    }

    // 2. Check images array
    if (list.length === 0 && Array.isArray(data.images) && data.images.length > 0) {
      data.images.forEach((url, idx) => {
        if (url) {
          list.push({
            id: `img-${idx}`,
            type: "image",
            url,
            badge: `Medical Instrument 0${idx + 1}`,
            caption: "",
          });
        }
      });
    }

    // 3. Check single imageUrl / image
    if (list.length === 0 && (data.imageUrl || data.image)) {
      const singleImg = data.imageUrl || data.image;
      if (singleImg) {
        list.push({
          id: "single-img",
          type: "image",
          url: singleImg,
          badge: "Diagnostic Equipment",
          caption: "",
        });
      }
    }

    // 4. Check videos array
    if (Array.isArray(data.videos) && data.videos.length > 0) {
      data.videos.forEach((vUrl, idx) => {
        if (vUrl && !list.some((item) => item.url === vUrl)) {
          list.push({
            id: `vid-${idx}`,
            type: "video",
            url: vUrl,
            badge: `Product Demo 0${idx + 1}`,
            caption: "",
          });
        }
      });
    }

    // 5. Check single videoUrl
    if (data.videoUrl && !list.some((item) => item.url === data.videoUrl)) {
      list.push({
        id: "single-vid",
        type: "video",
        url: data.videoUrl,
        badge: "Video Demonstration",
        caption: "",
      });
    }

    return list;
  };

  const dbSlides = parseMediaList(homeData);
  const slides = dbSlides.length > 0 ? dbSlides : FALLBACK_SLIDES;

  // Dynamic texts from Admin Firestore data
  const heroTitle =
    homeData?.title?.trim() ||
    (locationTitle
      ? `Leading Biomedical & Diagnostic Supplier in ${locationTitle}`
      : "");

  const heroDescription = homeData?.description?.trim() || "";

  const btn1Text =
    homeData?.button1Text?.trim() ||
    homeData?.btn1Text?.trim() ||
    homeData?.buttonText?.trim() ||
    "Explore Products";

  const btn2Text =
    homeData?.button2Text?.trim() ||
    homeData?.btn2Text?.trim() ||
    "Contact Us";

  const btn1Href = makeLink("/items");
  const btn2Href = makeLink("/contact");

  // Auto-rotate stacked cards
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, currentSlide]);

  // Adjust active slide index safely
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  // Play video on current slide
  useEffect(() => {
    const currentMedia = slides[currentSlide];
    if (currentMedia?.type === "video") {
      const vid = videoRefs.current[currentSlide];
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
    }
  }, [currentSlide, slides]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Touch gestures for mobile swipe
  const minSwipeDistance = 45;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  // Helper to calculate stacked position for card at index `idx`
  const getStackedProps = (idx) => {
    const total = slides.length;
    const diff = (idx - currentSlide + total) % total;

    if (diff === 0) {
      // Front active card
      return {
        zIndex: 30,
        scale: 1,
        y: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
        pointerEvents: "auto",
        filter: "brightness(1)",
      };
    } else if (diff === 1) {
      // First card behind (offset right & down with subtle angle)
      return {
        zIndex: 20,
        scale: 0.94,
        y: 16,
        x: 24,
        rotate: 2.5,
        opacity: 0.88,
        pointerEvents: "auto",
        filter: "brightness(0.92)",
      };
    } else if (diff === 2) {
      // Second card behind
      return {
        zIndex: 10,
        scale: 0.88,
        y: 32,
        x: 48,
        rotate: 5,
        opacity: 0.65,
        pointerEvents: "auto",
        filter: "brightness(0.82)",
      };
    } else {
      // Hidden cards in background
      return {
        zIndex: 0,
        scale: 0.8,
        y: 45,
        x: 60,
        rotate: 7,
        opacity: 0,
        pointerEvents: "none",
        filter: "brightness(0.7)",
      };
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1C120B] via-[#2A1B11] to-[#170E08] text-white py-12 md:py-18 lg:py-20">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#9E532B]/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#7D3B17]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(228,210,192,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(228,210,192,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Hero Content & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#E4D2C0]/25 bg-[#9E532B]/25 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FAF5EE] backdrop-blur-md shadow-sm w-fit"
            >
              <Sparkles size={14} className="text-[#E4A87C] animate-pulse" />
              <span>
                {locationTitle
                  ? `Leading Biomedical Supplier in ${locationTitle}`
                  : "Certified Biomedical & Diagnostic Partner"}
              </span>
            </motion.div>

            {/* Hero Title */}
            {heroTitle ? (
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.12]"
              >
                {heroTitle}
              </motion.h1>
            ) : null}

            {/* Hero Description */}
            {heroDescription ? (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-[#FAF5EE]/90 max-w-2xl font-normal"
              >
                {heroDescription}
              </motion.p>
            ) : null}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-7 sm:mt-8 flex flex-wrap items-center gap-4"
            >
              <Link
                href={btn1Href}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#9E532B] !text-white px-7 py-3.5 text-sm sm:text-base font-bold shadow-xl shadow-[#9E532B]/35 transition-all duration-300 hover:bg-[#7D3B17] hover:shadow-2xl hover:-translate-y-0.5"
              >
                <span className="!text-white font-bold">{btn1Text}</span>
                <ArrowRight size={18} className="!text-white" />
              </Link>

              <Link
                href={btn2Href}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/30 bg-white/10 !text-white px-7 py-3.5 text-sm sm:text-base font-bold backdrop-blur-md transition-all duration-300 hover:bg-white hover:!text-[#38240D] hover:border-white hover:-translate-y-0.5 shadow-md"
              >
                <PhoneCall size={18} className="text-[#E4A87C]" />
                <span className="font-bold">{btn2Text}</span>
              </Link>
            </motion.div>

            {/* Trust Points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6 border-t border-white/15 pt-5 text-xs sm:text-sm font-semibold text-[#FAF5EE]/85"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#E4A87C] shrink-0" />
                <span>ISO 13485 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#E4A87C] shrink-0" />
                <span>24/7 SLA Engineering</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#E4A87C] shrink-0" />
                <span>NABL Traceable QC</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D Stacked Cards Deck */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div
              className="relative w-full max-w-[420px] sm:max-w-[460px] h-[340px] sm:h-[400px] md:h-[440px] select-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {slides.map((slide, idx) => {
                const style = getStackedProps(idx);
                const isTop = (idx - currentSlide + slides.length) % slides.length === 0;

                return (
                  <motion.div
                    key={slide.id || idx}
                    animate={{
                      scale: style.scale,
                      y: style.y,
                      x: style.x,
                      rotate: style.rotate,
                      opacity: style.opacity,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 240,
                      damping: 24,
                    }}
                    style={{
                      zIndex: style.zIndex,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      filter: style.filter,
                    }}
                    onClick={() => {
                      if (!isTop) {
                        setCurrentSlide(idx);
                      }
                    }}
                    className={`cursor-pointer overflow-hidden rounded-3xl border-2 border-[#E4D2C0]/40 bg-[#24170E] shadow-2xl transition-shadow ${
                      isTop
                        ? "shadow-[#9E532B]/30 ring-2 ring-[#9E532B]/40"
                        : "hover:border-[#E4D2C0]/80"
                    }`}
                  >
                    {/* Media container */}
                    <div className="relative w-full h-full">
                      {slide.type === "video" ? (
                        <video
                          ref={(el) => (videoRefs.current[idx] = el)}
                          src={slide.url}
                          autoPlay={isTop}
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <img
                          src={slide.url}
                          alt={`Equipment Card ${idx + 1}`}
                          className="w-full h-full object-cover object-center brightness-[0.95] contrast-[1.05]"
                          onError={(e) => {
                            e.target.src = FALLBACK_SLIDES[0].url;
                          }}
                        />
                      )}

                      {/* Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                      {/* Card Top Pill Badge */}
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-[#FAF5EE] border border-white/25">
                        <Layers size={13} className="text-[#E4A87C]" />
                        <span>{slide.badge || `Clinical Instrument ${idx + 1}`}</span>
                      </div>

                      {/* Card Bottom Info */}
                      {slide.caption && (
                        <div className="absolute bottom-4 left-4 right-4 z-20">
                          <p className="text-xs sm:text-sm font-bold text-white drop-shadow-md line-clamp-2">
                            {slide.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stack Controls & Navigation Bar */}
            <div className="mt-6 flex items-center justify-between gap-4 w-full max-w-[420px] sm:max-w-[460px] px-2">
              {/* Slide Counter & Media Indicator */}
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-[#FAF5EE] border border-white/20 shadow-sm">
                {slides[currentSlide]?.type === "video" ? (
                  <Film size={14} className="text-[#E4A87C]" />
                ) : (
                  <ImageIcon size={14} className="text-[#E4A87C]" />
                )}
                <span>
                  Card {String(currentSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </span>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to card ${idx + 1}`}
                    className={`transition-all duration-300 rounded-full h-2 ${
                      currentSlide === idx
                        ? "w-6 bg-[#9E532B] shadow-md shadow-[#9E532B]/50"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next & Autoplay Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Pause rotation" : "Auto rotate"}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-sm"
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                </button>

                <button
                  type="button"
                  onClick={handlePrev}
                  title="Previous card"
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-[#9E532B] hover:border-[#9E532B] transition-all shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  title="Next card"
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-[#9E532B] hover:border-[#9E532B] transition-all shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
