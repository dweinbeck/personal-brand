"use client";

import { getBrandDisplayName } from "@/lib/brand-scraper/display-name";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { BrandCardColors } from "./BrandCardColors";
import { BrandCardDescription } from "./BrandCardDescription";
import { BrandCardDownloads } from "./BrandCardDownloads";
import { BrandCardHeader } from "./BrandCardHeader";
import { BrandCardLogos } from "./BrandCardLogos";

type BrandCardProps = {
  result: BrandTaxonomy;
  brandJsonUrl?: string;
  jobId: string;
  getIdToken: () => Promise<string>;
};

export function BrandCard({
  result,
  brandJsonUrl,
  jobId,
  getIdToken,
}: BrandCardProps) {
  let hostname: string;
  try {
    hostname = new URL(result.source.site_url).hostname;
  } catch {
    hostname = result.source.site_url;
  }

  const favicon = result.assets?.favicons?.[0]?.value?.url;
  const displayName = getBrandDisplayName(
    result.identity,
    result.source.site_url,
  );

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <BrandCardHeader
        favicon={favicon}
        hostname={hostname}
        displayName={displayName}
      />
      <div className="p-6 space-y-6">
        <BrandCardLogos logos={result.assets} />
        <BrandCardColors palette={result.color} />
        <BrandCardDescription
          identity={result.identity}
          typography={result.typography}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <BrandCardDownloads
            brandJsonUrl={brandJsonUrl}
            jobId={jobId}
            getIdToken={getIdToken}
          />
        </div>
      </div>
    </div>
  );
}
