"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";

type BrandCardLogosProps = {
  logos: BrandTaxonomy["assets"];
};

/** Image with error fallback — renders a placeholder icon when the URL fails or loads as a tiny/invisible pixel. */
function AssetImage({
  src,
  alt,
  maxHeightClass,
  onClick,
}: {
  src: string;
  alt: string;
  maxHeightClass: string;
  onClick: () => void;
}) {
  const [failed, setFailed] = useState(false);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      // Treat tiny images (tracking pixels, 1x1 spacers) as broken
      if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        setFailed(true);
      }
    },
    [],
  );

  if (failed) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border p-3 bg-white dark:bg-gray-900 cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold"
    >
      {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
      <img
        src={src}
        loading="lazy"
        alt={alt}
        onError={() => setFailed(true)}
        onLoad={handleLoad}
        className={`${maxHeightClass} object-contain`}
      />
    </button>
  );
}

export function BrandCardLogos({ logos: assets }: BrandCardLogosProps) {
  const logos = (assets?.logos ?? []).filter((e) => e.value.url?.trim());
  const favicons = (assets?.favicons ?? []).filter((e) => e.value.url?.trim());
  const ogImages = (assets?.og_images ?? []).filter((e) => e.value.url?.trim());
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setSelectedUrl(null), []);

  // Close on Escape key
  useEffect(() => {
    if (!selectedUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [selectedUrl, closeLightbox]);

  const hasAnyAssets =
    logos.length > 0 || favicons.length > 0 || ogImages.length > 0;

  if (!hasAnyAssets) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Brand Assets
        </h3>
        <p className="text-sm text-text-tertiary">No assets detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Logos */}
      {logos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Logos
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {logos.map((entry, i) => (
              <AssetImage
                key={entry.value.url}
                src={entry.value.url}
                alt={`Logo ${i + 1}`}
                maxHeightClass="max-h-32"
                onClick={() => setSelectedUrl(entry.value.url)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Favicons */}
      {favicons.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Favicons
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {favicons.map((entry, i) => (
              <AssetImage
                key={entry.value.url}
                src={entry.value.url}
                alt={`Favicon ${i + 1}`}
                maxHeightClass="max-h-16"
                onClick={() => setSelectedUrl(entry.value.url)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Social Previews (OG images) */}
      {ogImages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Social Previews
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {ogImages.map((entry, i) => (
              <AssetImage
                key={entry.value.url}
                src={entry.value.url}
                alt={`Social preview ${i + 1}`}
                maxHeightClass="max-h-24"
                onClick={() => setSelectedUrl(entry.value.url)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox overlay */}
      {selectedUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeLightbox}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeLightbox();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Asset preview"
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: presentation wrapper to stop click propagation on backdrop */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] p-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white dark:bg-gray-800 border border-border shadow-md flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close preview"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Close"
              >
                <title>Close</title>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
            <img
              src={selectedUrl}
              alt="Asset full size"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
