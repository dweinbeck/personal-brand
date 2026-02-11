"use client";

import type { AssetManifestEntry } from "@/lib/brand-scraper/types";

/**
 * Placeholder — full implementation in Task 2.
 */
export function AssetGrid({ assets }: { assets: AssetManifestEntry[] }) {
  return (
    <div>
      <p className="text-sm text-text-tertiary">
        {assets.length} asset{assets.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
