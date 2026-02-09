"use client";

import { useState } from "react";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandConfidenceBadge } from "./BrandConfidenceBadge";

type ColorPaletteCardProps = {
  colors: BrandTaxonomy["colors"];
};

export function ColorPaletteCard({ colors }: ColorPaletteCardProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  if (!colors || colors.length === 0) {
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
        {colors.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => handleCopy(color.hex)}
            className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-gold-light transition-colors"
          >
            <span
              className="h-10 w-10 shrink-0 rounded-lg border border-border shadow-sm"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <span className="block font-mono text-sm text-text-primary">
                {copiedHex === color.hex ? (
                  <span className="text-emerald-600 text-xs">Copied!</span>
                ) : (
                  color.hex
                )}
              </span>
              {color.name && (
                <span className="block text-xs text-text-secondary truncate">
                  {color.name}
                </span>
              )}
            </div>
            <BrandConfidenceBadge score={color.confidence} />
          </button>
        ))}
      </div>
    </div>
  );
}
