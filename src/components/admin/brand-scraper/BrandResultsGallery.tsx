"use client";

import { Card } from "@/components/ui/Card";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { ColorPaletteCard } from "./ColorPaletteCard";
import { DownloadLinks } from "./DownloadLinks";
import { LogoAssetsCard } from "./LogoAssetsCard";
import { TypographyCard } from "./TypographyCard";

type BrandResultsGalleryProps = {
  result: BrandTaxonomy;
  brandJsonUrl?: string;
  assetsZipUrl?: string;
};

export function BrandResultsGallery({
  result,
  brandJsonUrl,
  assetsZipUrl,
}: BrandResultsGalleryProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">Results</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <ColorPaletteCard palette={result.color} />
        </Card>
        <Card>
          <TypographyCard typography={result.typography} />
        </Card>
        <Card>
          <LogoAssetsCard assets={result.assets} />
        </Card>
        <Card>
          <DownloadLinks
            brandJsonUrl={brandJsonUrl}
            assetsZipUrl={assetsZipUrl}
          />
        </Card>
      </div>
    </div>
  );
}
