"use client";

import type { BrandTaxonomy } from "@/lib/brand-scraper/types";

type BrandCardLogosProps = {
  logos: BrandTaxonomy["assets"];
};

export function BrandCardLogos({ logos: assets }: BrandCardLogosProps) {
  const entries = assets?.logos ?? [];

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
          <div
            key={entry.value.url}
            className="rounded-lg border border-border p-3 bg-white dark:bg-gray-900"
          >
            {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
            <img
              src={entry.value.url}
              loading="lazy"
              alt={`Logo ${i + 1}`}
              className="max-h-16 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
