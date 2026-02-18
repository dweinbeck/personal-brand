"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";

type BrandCardLogosProps = {
  logos: BrandTaxonomy["assets"];
};

export function BrandCardLogos({ logos: assets }: BrandCardLogosProps) {
  const entries = assets?.logos ?? [];
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

  if (entries.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Logos</h3>
        <p className="text-sm text-text-tertiary">No logos detected</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Logos</h3>
      <div className="flex flex-wrap gap-4">
        {entries.map((entry, i) => (
          <button
            key={entry.value.url}
            type="button"
            onClick={() => setSelectedUrl(entry.value.url)}
            className="rounded-lg border border-border p-3 bg-white dark:bg-gray-900 cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
            <img
              src={entry.value.url}
              loading="lazy"
              alt={`Logo ${i + 1}`}
              className="max-h-16 object-contain"
            />
          </button>
        ))}
      </div>

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
          aria-label="Logo preview"
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
              alt="Logo full size"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
