"use client";

import { useGoogleFont } from "@/lib/brand-scraper/fonts";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";

type BrandCardDescriptionProps = {
  identity?: BrandTaxonomy["identity"];
  typography?: BrandTaxonomy["typography"];
};

export function BrandCardDescription({
  identity,
  typography,
}: BrandCardDescriptionProps) {
  // Find the first Google Fonts family from the extracted typography
  const googleFontEntry = typography?.font_families?.find(
    (entry) => entry.value.source === "google_fonts",
  );
  const primaryFontFamily = googleFontEntry?.value.family ?? null;

  const { loaded } = useGoogleFont(primaryFontFamily);

  const displayText =
    identity?.tagline || identity?.industry_guess || "Brand typography preview";

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Brand Identity
      </h3>
      <div
        className="rounded-lg border border-border bg-white dark:bg-gray-900 p-4 transition-all duration-300"
        style={{
          fontFamily:
            loaded && primaryFontFamily
              ? `"${primaryFontFamily}", sans-serif`
              : "sans-serif",
        }}
      >
        <p className="text-lg text-text-primary leading-relaxed">
          {displayText}
        </p>
      </div>
      {primaryFontFamily && (
        <p className="text-xs text-text-tertiary mt-2">
          Font: {primaryFontFamily}
          {!loaded && " (loading...)"}
        </p>
      )}
    </div>
  );
}
