"use client";

import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandConfidenceBadge } from "./BrandConfidenceBadge";

type LogoAssetsCardProps = {
  logos: BrandTaxonomy["logos"];
  assets: BrandTaxonomy["assets"];
};

export function LogoAssetsCard({ logos, assets }: LogoAssetsCardProps) {
  const hasLogos = logos && logos.length > 0;
  const hasAssets = assets && assets.length > 0;

  if (!hasLogos && !hasAssets) {
    return (
      <p className="text-sm text-text-tertiary">No logos or assets detected.</p>
    );
  }

  return (
    <div>
      {hasLogos && (
        <>
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Logos
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {logos.map((logo, i) => (
              <div
                key={logo.url}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-3"
              >
                {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
                <img
                  src={logo.url}
                  loading="lazy"
                  alt={`Logo ${i + 1}`}
                  className="max-h-24 w-full object-contain"
                />
                <div className="flex items-center gap-2">
                  {logo.format && (
                    <span className="text-[10px] font-medium uppercase text-text-tertiary">
                      {logo.format}
                    </span>
                  )}
                  <BrandConfidenceBadge score={logo.confidence} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasAssets && (
        <>
          <h3 className="text-sm font-semibold text-text-primary mb-3 mt-4">
            Assets
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {assets.map((asset, i) => (
              <div
                key={asset.url}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-3"
              >
                {/* biome-ignore lint/performance/noImgElement: GCS signed URLs have dynamic hostnames incompatible with next/image */}
                <img
                  src={asset.url}
                  loading="lazy"
                  alt={asset.type || `Asset ${i + 1}`}
                  className="max-h-24 w-full object-contain"
                />
                {asset.type && (
                  <span className="text-xs text-text-secondary">
                    {asset.type}
                  </span>
                )}
                {asset.confidence != null && (
                  <BrandConfidenceBadge score={asset.confidence} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
