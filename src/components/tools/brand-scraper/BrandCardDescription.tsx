"use client";

import { useGoogleFont } from "@/lib/brand-scraper/fonts";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";

type BrandCardDescriptionProps = {
  identity?: BrandTaxonomy["identity"];
  typography?: BrandTaxonomy["typography"];
};

type FontEntry = NonNullable<
  BrandTaxonomy["typography"]
>["font_families"][number];

function getFontSizeClass(usage?: string): string {
  if (!usage) return "text-lg";
  const lower = usage.toLowerCase();
  if (
    lower.includes("heading") ||
    lower.includes("display") ||
    lower.includes("title")
  )
    return "text-2xl";
  if (lower.includes("body") || lower.includes("paragraph")) return "text-base";
  return "text-lg";
}

/** Renders a single font entry in its actual typeface (Google Fonts only). */
function TypographyEntry({ entry }: { entry: FontEntry }) {
  const isGoogle = entry.value.source === "google_fonts";
  const { loaded, error } = useGoogleFont(
    isGoogle ? entry.value.family : null,
    entry.value.weight ?? "400",
  );

  const fontStyle: React.CSSProperties =
    isGoogle && loaded
      ? {
          fontFamily: `"${entry.value.family}", sans-serif`,
          fontWeight: entry.value.weight ?? 400,
        }
      : {};

  const sizeClass = getFontSizeClass(entry.value.usage);

  return (
    <div className="rounded-lg border border-border bg-white dark:bg-gray-900 p-3">
      {/* Usage role label */}
      {entry.value.usage && (
        <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
          {entry.value.usage}
        </p>
      )}
      {/* Font preview — the family name rendered in its own typeface */}
      <p
        className={`${sizeClass} text-text-primary leading-snug mb-1`}
        style={fontStyle}
      >
        {entry.value.family}
        {isGoogle && !loaded && !error && (
          <span className="text-xs text-text-tertiary ml-2">(loading...)</span>
        )}
        {isGoogle && error && (
          <span className="text-xs text-text-tertiary ml-2">
            (font unavailable)
          </span>
        )}
      </p>
      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
        {entry.value.weight && <span>{entry.value.weight}</span>}
        {entry.value.source && (
          <span>({entry.value.source.replace(/_/g, " ")})</span>
        )}
      </div>
    </div>
  );
}

export function BrandCardDescription({
  identity,
  typography,
}: BrandCardDescriptionProps) {
  const fontFamilies = typography?.font_families ?? [];

  // Find the first Google Fonts family for the tagline preview
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
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">
              Typography
            </p>
            <div className="space-y-2">
              {fontFamilies.map((entry) => (
                <TypographyEntry
                  key={`${entry.value.family}-${entry.value.weight}-${entry.value.usage ?? ""}`}
                  entry={entry}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
