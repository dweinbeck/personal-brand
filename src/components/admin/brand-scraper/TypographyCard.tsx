"use client";

import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandConfidenceBadge } from "./BrandConfidenceBadge";

type TypographyCardProps = {
  fonts: BrandTaxonomy["fonts"];
};

export function TypographyCard({ fonts }: TypographyCardProps) {
  if (!fonts || fonts.length === 0) {
    return <p className="text-sm text-text-tertiary">No fonts detected.</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Typography
      </h3>
      <div className="space-y-4">
        {fonts.map((font) => (
          <div
            key={font.family}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-text-primary">{font.family}</p>
              {font.weights && font.weights.length > 0 && (
                <p className="text-xs text-text-secondary">
                  Weights: {font.weights.join(", ")}
                </p>
              )}
              {font.usage && (
                <p className="text-xs text-text-tertiary">{font.usage}</p>
              )}
              {font.source === "google_fonts" && (
                <a
                  href={`https://fonts.google.com/specimen/${encodeURIComponent(font.family)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:underline"
                >
                  View on Google Fonts
                </a>
              )}
            </div>
            <BrandConfidenceBadge score={font.confidence} />
          </div>
        ))}
      </div>
    </div>
  );
}
