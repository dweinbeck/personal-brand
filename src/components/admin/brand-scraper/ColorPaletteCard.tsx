"use client";

import { useState } from "react";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandConfidenceBadge } from "./BrandConfidenceBadge";

type ColorPaletteCardProps = {
  palette: BrandTaxonomy["color"];
};

export function ColorPaletteCard({ palette }: ColorPaletteCardProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const entries = palette?.palette;
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-text-tertiary">No colors detected.</p>;
  }

  function handleCopy(hex: string) {
    navigator.clipboard.writeText(hex).then(
      () => {
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1500);
      },
      () => {
        // Silently fail on non-HTTPS or denied clipboard access
      },
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">Colors</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map((entry) => (
          <button
            key={entry.value.hex}
            type="button"
            onClick={() => handleCopy(entry.value.hex)}
            className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-gold-light transition-colors"
          >
            <span
              className="h-10 w-10 shrink-0 rounded-lg border border-border shadow-sm"
              style={{ backgroundColor: entry.value.hex }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <span className="block font-mono text-sm text-text-primary">
                {copiedHex === entry.value.hex ? (
                  <span className="text-emerald-600 text-xs">Copied!</span>
                ) : (
                  entry.value.hex
                )}
              </span>
              {entry.value.role && (
                <span className="block text-xs text-text-secondary truncate">
                  {entry.value.role}
                </span>
              )}
            </div>
            <BrandConfidenceBadge score={entry.confidence} />
          </button>
        ))}
      </div>
    </div>
  );
}
