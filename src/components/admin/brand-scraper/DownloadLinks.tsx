"use client";

import { Button } from "@/components/ui/Button";

type DownloadLinksProps = {
  brandJsonUrl?: string;
  assetsZipUrl?: string;
};

export function DownloadLinks({
  brandJsonUrl,
  assetsZipUrl,
}: DownloadLinksProps) {
  if (!brandJsonUrl && !assetsZipUrl) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        Downloads
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        {brandJsonUrl && (
          <Button
            href={brandJsonUrl}
            variant="secondary"
            size="sm"
            download="brand.json"
          >
            Download Brand Data (JSON)
          </Button>
        )}
        {assetsZipUrl && (
          <Button
            href={assetsZipUrl}
            variant="secondary"
            size="sm"
            download="assets.zip"
          >
            Download Assets (ZIP)
          </Button>
        )}
      </div>
    </div>
  );
}
