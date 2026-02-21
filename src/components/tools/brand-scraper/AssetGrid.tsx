"use client";

import { useCallback, useMemo, useState } from "react";
import type { AssetManifestEntry } from "@/lib/brand-scraper/types";

/** Minimum size in bytes to display an asset — smaller files are typically tracking pixels or empty placeholders. */
const MIN_ASSET_SIZE_BYTES = 100;

/** Sample size for canvas-based visibility check — small for performance. */
const VISIBILITY_SAMPLE_SIZE = 64;

/** Minimum alpha value to consider a pixel "visible" (0–255 scale). */
const MIN_VISIBLE_ALPHA = 10;

/**
 * Check whether an image has any visible pixels by drawing it to a small canvas
 * and scanning the alpha channel. Returns false for fully transparent images
 * (spacers, invisible overlays, transparent placeholders).
 *
 * Wrapped in try/catch — returns true (assume visible) if CORS blocks pixel access.
 */
function hasVisiblePixels(img: HTMLImageElement): boolean {
  try {
    const canvas = document.createElement("canvas");
    const w = Math.min(img.naturalWidth, VISIBILITY_SAMPLE_SIZE);
    const h = Math.min(img.naturalHeight, VISIBILITY_SAMPLE_SIZE);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    // Every 4th byte is the alpha channel — if any pixel exceeds threshold, image is visible
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > MIN_VISIBLE_ALPHA) return true;
    }
    return false;
  } catch {
    // CORS or SecurityError — can't inspect pixels, assume visible
    return true;
  }
}

/** Check if the content type is an image that browsers can render. */
function isImageType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/** Convert byte count to a human-readable size string. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Map category slug to a readable label. */
function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    logos: "Logo",
    favicons: "Favicon",
    og_images: "OG Image",
    screenshots: "Screenshot",
    icons: "Icon",
    images: "Image",
  };
  if (map[category]) return map[category];
  // Fallback: capitalize and replace underscores
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Get a short file-type label from content_type for the placeholder icon. */
function getFileTypeLabel(contentType: string): string {
  const parts = contentType.split("/");
  const subtype = parts[1] ?? parts[0];
  // Common short labels
  const map: Record<string, string> = {
    "svg+xml": "SVG",
    svg: "SVG",
    png: "PNG",
    jpeg: "JPEG",
    jpg: "JPG",
    gif: "GIF",
    webp: "WEBP",
    css: "CSS",
    json: "JSON",
    javascript: "JS",
    html: "HTML",
    pdf: "PDF",
    "x-icon": "ICO",
    "vnd.microsoft.icon": "ICO",
  };
  return map[subtype] ?? subtype.toUpperCase();
}

function AssetCard({ asset }: { asset: AssetManifestEntry }) {
  const isImage = isImageType(asset.content_type);
  const [hidden, setHidden] = useState(false);

  /** Hide the card when the image fails to load. */
  const handleError = useCallback(() => setHidden(true), []);

  /** Hide the card when the loaded image is a tiny invisible pixel or fully transparent. */
  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        setHidden(true);
        return;
      }
      // Canvas-based check: hide images that are 100% transparent (spacers, invisible overlays)
      if (!hasVisiblePixels(img)) {
        setHidden(true);
      }
    },
    [],
  );

  // Don't render anything for broken/invisible images
  if (hidden) return null;

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Preview area */}
      {isImage && asset.signed_url ? (
        // biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames
        <img
          src={asset.signed_url}
          alt={asset.filename}
          loading="lazy"
          crossOrigin="anonymous"
          onError={handleError}
          onLoad={handleLoad}
          className="h-40 w-full object-contain bg-gray-50 p-2"
        />
      ) : (
        <div className="h-40 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-2">
            {/* Simple file icon */}
            <svg
              className="h-10 w-10 text-text-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <span className="text-xs font-medium text-text-tertiary">
              {getFileTypeLabel(asset.content_type)}
            </span>
          </div>
        </div>
      )}

      {/* Info area */}
      <div className="p-3">
        <p className="text-sm font-medium text-text-primary truncate">
          {asset.filename}
        </p>
        <span className="inline-block text-xs bg-gray-100 text-text-secondary rounded-full px-2 py-0.5 mt-1">
          {getCategoryLabel(asset.category)}
        </span>
        <p className="text-xs text-text-tertiary mt-1">
          {formatFileSize(asset.size_bytes)}
        </p>
      </div>

      {/* Download area */}
      <div className="px-3 pb-3">
        {asset.signed_url ? (
          <a
            href={asset.signed_url}
            download={asset.filename}
            className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 font-medium transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download
          </a>
        ) : (
          <span className="text-xs text-text-tertiary">Unavailable</span>
        )}
      </div>
    </div>
  );
}

export function AssetGrid({ assets }: { assets: AssetManifestEntry[] }) {
  // Pre-filter assets: drop extremely small files that are almost certainly tracking pixels / empty placeholders
  const filteredAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.size_bytes >= MIN_ASSET_SIZE_BYTES || !isImageType(a.content_type),
      ),
    [assets],
  );

  // Group assets by category
  const grouped = useMemo(() => {
    const groups: Record<string, AssetManifestEntry[]> = {};
    for (const asset of filteredAssets) {
      const cat = asset.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(asset);
    }
    return Object.entries(groups);
  }, [filteredAssets]);

  // If only one category, skip the section headers
  if (grouped.length === 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <AssetCard
            key={`${asset.category}-${asset.filename}`}
            asset={asset}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {grouped.map(([category, categoryAssets], idx) => (
        <div key={category}>
          <h3
            className={`text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3 ${idx === 0 ? "" : "mt-8"}`}
          >
            {getCategoryLabel(category)}s
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAssets.map((asset) => (
              <AssetCard
                key={`${asset.category}-${asset.filename}`}
                asset={asset}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
