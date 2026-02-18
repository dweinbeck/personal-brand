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
  const fontFamilies = typography?.font_families ?? [];

  // Find the first Google Fonts family for the preview
  const googleFontEntry = fontFamilies.find(
    (entry) => entry.value.source === "google_fonts",
  );
  const primaryFontFamily = googleFontEntry?.value.family ?? null;
  const { loaded } = useGoogleFont(primaryFontFamily);

  const hasTagline = identity?.tagline;
  const hasIndustry = identity?.industry_guess;
  const hasIdentityData = hasTagline || hasIndustry;
  const hasFonts = fontFamilies.length > 0;

  if (!hasIdentityData && !hasFonts) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Brand Identity
        </h3>
        <p className="text-sm text-text-tertiary">
          No brand identity data detected
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Brand Identity
      </h3>
      <div className="space-y-4">
        {/* Tagline */}
        {hasTagline && (
          <div
            className="rounded-lg border border-border bg-white dark:bg-gray-900 p-4 transition-all duration-300"
            style={{
              fontFamily:
                loaded && primaryFontFamily
                  ? `"${primaryFontFamily}", sans-serif`
                  : "sans-serif",
            }}
          >
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-1">
              Tagline
            </p>
            <p className="text-lg text-text-primary leading-relaxed">
              {identity.tagline}
            </p>
          </div>
        )}

        {/* Industry */}
        {hasIndustry && (
          <div>
            <span className="inline-block text-xs font-medium text-text-secondary bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              {identity.industry_guess}
            </span>
          </div>
        )}

        {/* Typography */}
        {hasFonts && (
          <div className="rounded-lg border border-border bg-white dark:bg-gray-900 p-4">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
              Typography
            </p>
            <ul className="space-y-1.5">
              {fontFamilies.map((entry) => (
                <li
                  key={`${entry.value.family}-${entry.value.weight}-${entry.value.usage ?? ""}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="font-medium text-text-primary">
                    {entry.value.family}
                  </span>
                  <span className="text-text-tertiary">
                    {entry.value.weight}
                  </span>
                  {entry.value.usage && (
                    <span className="text-xs text-text-tertiary bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      {entry.value.usage}
                    </span>
                  )}
                  {entry.value.source && (
                    <span className="text-xs text-text-tertiary">
                      ({entry.value.source.replace(/_/g, " ")})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Google Font preview */}
        {primaryFontFamily && (
          <p className="text-xs text-text-tertiary">
            Preview font: {primaryFontFamily}
            {!loaded && " (loading...)"}
          </p>
        )}
      </div>
    </div>
  );
}
