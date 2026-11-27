"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ImageOff, RefreshCw } from "lucide-react";

export interface VariantDetail {
  url: string;
  key?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface SafeImageProps {
  src?: string | null;
  variants?: Record<string, VariantDetail> | string | null;
  blurData?: string | null;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none";
  fallbackText?: string;
  sizes?: string;
  onClick?: () => void;
}

export default function SafeImage({
  src,
  variants: rawVariants,
  blurData,
  alt,
  width,
  height,
  fill = false,
  className = "",
  containerClassName = "",
  priority = false,
  objectFit = "cover",
  fallbackText = "Image unavailable",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  onClick,
}: SafeImageProps) {
  // Parse variants if provided as JSON string
  const parsedVariants: Record<string, VariantDetail> | null = (() => {
    if (!rawVariants) return null;
    if (typeof rawVariants === "object") return rawVariants as Record<string, VariantDetail>;
    try {
      return JSON.parse(rawVariants);
    } catch {
      return null;
    }
  })();

  // Resolve responsive variant candidates in preferential fallback order
  const variantSources = [
    parsedVariants?.large?.url,
    parsedVariants?.medium?.url,
    parsedVariants?.preview?.url,
    parsedVariants?.thumb?.url,
    src,
  ].filter(Boolean) as string[];

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasRetried, setHasRetried] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasFatalError, setHasFatalError] = useState(false);

  // Active image URL being rendered
  const activeSrc = variantSources[currentSourceIndex] || src || null;

  useEffect(() => {
    setCurrentSourceIndex(0);
    setHasRetried(false);
    setIsLoaded(false);
    setHasFatalError(!activeSrc);
  }, [src, rawVariants]);

  // Construct responsive srcSet if variants exist
  const srcSetString = (() => {
    if (!parsedVariants) return undefined;
    const parts: string[] = [];
    if (parsedVariants.thumb?.url) parts.push(`${parsedVariants.thumb.url} 320w`);
    if (parsedVariants.medium?.url) parts.push(`${parsedVariants.medium.url} 800w`);
    if (parsedVariants.large?.url) parts.push(`${parsedVariants.large.url} 1600w`);
    return parts.length > 0 ? parts.join(", ") : undefined;
  })();

  const handleError = () => {
    // 1. Retry once on active source
    if (!hasRetried) {
      setHasRetried(true);
      return;
    }

    // 2. Try the next smaller variant if available
    if (currentSourceIndex < variantSources.length - 1) {
      setHasRetried(false);
      setCurrentSourceIndex((prev) => prev + 1);
      return;
    }

    // 3. All variants exhausted: show neutral safe placeholder without breaking page layout
    setHasFatalError(true);
  };

  const handleManualRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasFatalError(false);
    setHasRetried(false);
    setCurrentSourceIndex(0);
    setIsLoaded(false);
  };

  // Fatal error fallback state: Keeps layout proportions intact (Zero CLS)
  if (hasFatalError || !activeSrc) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center bg-slate-100 text-slate-400 select-none overflow-hidden ${
          fill ? "w-full h-full" : ""
        } ${containerClassName}`}
        style={!fill && width && height ? { width, height } : undefined}
        onClick={onClick}
      >
        <ImageOff className="w-6 h-6 text-slate-300 stroke-[1.5] mb-1" />
        <span className="text-[11px] font-medium text-slate-400 text-center px-2 line-clamp-1">
          {fallbackText}
        </span>
        <button
          type="button"
          onClick={handleManualRetry}
          title="Retry loading image"
          className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${
        fill ? "w-full h-full" : ""
      } ${containerClassName}`}
      style={!fill && width && height ? { width, height } : undefined}
      onClick={onClick}
    >
      {/* 1. Low-overhead Inline Blur Placeholder (shows immediately, eliminates layout shifting) */}
      {blurData && !isLoaded && (
        <img
          src={blurData}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full pointer-events-none scale-105 filter blur-md transition-opacity duration-500 ${
            isLoaded ? "opacity-0" : "opacity-100"
          }`}
          style={{ objectFit }}
        />
      )}

      {/* 2. Responsive Real Image with Fade-in on load */}
      <img
        src={activeSrc}
        srcSet={srcSetString}
        sizes={srcSetString ? sizes : undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full transition-all duration-300 ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
        } ${className}`}
        style={{ objectFit }}
      />
    </div>
  );
}
