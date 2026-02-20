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
  const [jsonDownloading, setJsonDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Download brand JSON via fetch+blob to force a file save dialog (cross-origin URLs ignore the download attribute). */
  const handleJsonDownload = useCallback(async () => {
    if (!brandJsonUrl) return;
    setJsonDownloading(true);
    setError(null);
    try {
      const res = await fetch(brandJsonUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "brand.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab if fetch fails (e.g. CORS)
      window.open(brandJsonUrl, "_blank");
    } finally {
      setJsonDownloading(false);
    }
  }, [brandJsonUrl]);

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
        const status = res.status;
        if (status === 403) {
          setError(
            "Asset download is temporarily unavailable. Try downloading the Brand JSON instead.",
          );
        } else {
          setError(body?.error ?? `Download failed (${status})`);
        }
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
            variant="secondary"
            size="sm"
            onClick={handleJsonDownload}
            disabled={jsonDownloading}
          >
            {jsonDownloading ? "Downloading..." : "Download Brand JSON"}
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
      {error && (
        <div className="flex flex-col items-end gap-1.5">
          <p className="text-xs text-red-600">{error}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleZipDownload}>
              Retry Download
            </Button>
            {brandJsonUrl && (
              <Button variant="ghost" size="sm" onClick={handleJsonDownload}>
                Download JSON Instead
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
