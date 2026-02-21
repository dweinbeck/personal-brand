"use client";

import { useState } from "react";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";

type BrandCardColorsProps = {
  palette?: BrandTaxonomy["color"];
};

/** Infer a role label from palette position when the scraper doesn't provide one. */
function inferRole(index: number): string {
  if (index === 0) return "Primary";
  if (index === 1) return "Secondary";
  if (index === 2) return "Accent";
  return "";
}

export function BrandCardColors({ palette }: BrandCardColorsProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const entries = palette?.palette;

  if (!entries || entries.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Color Palette
        </h3>
        <p className="text-sm text-text-tertiary">No colors detected</p>
      </div>
    );
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
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Color Palette
      </h3>
      <div className="flex flex-wrap gap-3">
        {entries.map((entry, index) => {
          const role = entry.value.role || inferRole(index);
          return (
            <button
              key={entry.value.hex}
              type="button"
              onClick={() => handleCopy(entry.value.hex)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span
                className="w-12 h-12 rounded-lg border border-border shadow-sm transition-transform group-hover:scale-110"
                style={{ backgroundColor: entry.value.hex }}
                aria-hidden="true"
              />
              <span className="font-mono text-xs text-text-secondary">
                {copiedHex === entry.value.hex ? (
                  <span className="text-emerald-600">Copied!</span>
                ) : (
                  entry.value.hex
                )}
              </span>
              {role && (
                <span className="text-xs text-text-secondary capitalize">
                  {role}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
