"use client";

import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandConfidenceBadge } from "./BrandConfidenceBadge";

type TypographyCardProps = {
  typography: BrandTaxonomy["typography"];
};

export function TypographyCard({ typography }: TypographyCardProps) {
  const entries = typography?.font_families;
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-text-tertiary">No fonts detected.</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Typography
      </h3>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.value.family}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">
                {entry.value.family}
              </p>
              {entry.value.weight && (
                <p className="text-xs text-text-secondary">
                  Weight: {entry.value.weight}
                </p>
              )}
              {entry.value.usage && (
                <p className="text-xs text-text-tertiary">
                  {entry.value.usage}
                </p>
              )}
              {entry.value.source === "google_fonts" && (
                <a
                  href={`https://fonts.google.com/specimen/${encodeURIComponent(entry.value.family)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:underline"
                >
                  View on Google Fonts
                </a>
              )}
            </div>
            <BrandConfidenceBadge score={entry.confidence} />
          </div>
        ))}
      </div>
    </div>
  );
}
