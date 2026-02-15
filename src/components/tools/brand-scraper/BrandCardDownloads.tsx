"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

type BrandCardDownloadsProps = {
  brandJsonUrl?: string;
  jobId: string;
  getIdToken: () => Promise<string>;
};

export function BrandCardDownloads({
  brandJsonUrl,
  jobId,
  getIdToken,
}: BrandCardDownloadsProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleZipDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);

    try {
      const freshToken = await getIdToken();
      const res = await fetch(
        `/api/tools/brand-scraper/jobs/${jobId}/assets/zip`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${freshToken}` },
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? `Download failed (${res.status})`);
        return;
      }

      const data = (await res.json()) as { zip_url: string };
      const a = document.createElement("a");
      a.href = data.zip_url;
      a.download = "brand-assets.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setDownloading(false);
    }
  }, [jobId, getIdToken]);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex justify-end gap-3">
        {brandJsonUrl && (
          <Button
            href={brandJsonUrl}
            variant="secondary"
            size="sm"
            download="brand.json"
          >
            Download Brand JSON
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZipDownload}
          disabled={downloading}
        >
          {downloading ? "Preparing download..." : "Download Assets"}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
