"use client";

import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandConfidenceBadge } from "./BrandConfidenceBadge";

type LogoAssetsCardProps = {
  assets: BrandTaxonomy["assets"];
};

export function LogoAssetsCard({ assets }: LogoAssetsCardProps) {
  const logos = assets?.logos ?? [];
  const favicons = assets?.favicons ?? [];
  const ogImages = assets?.og_images ?? [];

  const hasAny = logos.length > 0 || favicons.length > 0 || ogImages.length > 0;

  if (!hasAny) {
    return (
      <p className="text-sm text-text-tertiary">No logos or assets detected.</p>
    );
  }

  return (
    <div>
      {logos.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Logos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {logos.map((entry, i) => (
              <div
                key={entry.value.url}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-3"
              >
                {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
                <img
                  src={entry.value.url}
                  loading="lazy"
                  alt={`Logo ${i + 1}`}
                  className="max-h-24 w-full object-contain"
                />
                <div className="flex items-center gap-2">
                  {entry.value.format && (
                    <span className="text-[10px] font-medium uppercase text-text-tertiary">
                      {entry.value.format}
                    </span>
                  )}
                  <BrandConfidenceBadge score={entry.confidence} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {favicons.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-text-primary mb-3 mt-4">
            Favicons
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {favicons.map((entry, i) => (
              <div
                key={entry.value.url}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-3"
              >
                {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
                <img
                  src={entry.value.url}
                  loading="lazy"
                  alt={`Favicon ${i + 1}`}
                  className="max-h-16 w-full object-contain"
                />
                <BrandConfidenceBadge score={entry.confidence} />
              </div>
            ))}
          </div>
        </>
      )}

      {ogImages.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-text-primary mb-3 mt-4">
            OG Assets
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ogImages.map((entry, i) => (
              <div
                key={entry.value.url}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-3"
              >
                {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
                <img
                  src={entry.value.url}
                  loading="lazy"
                  alt={`Open Graph asset ${i + 1}`}
                  className="max-h-24 w-full object-contain"
                />
                <BrandConfidenceBadge score={entry.confidence} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
