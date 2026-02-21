"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

type BrandCardDownloadsProps = {
  brandJsonUrl?: string;
  jobId: string;
  getIdToken: () => Promise<string>;
};

/** Trigger a browser file download from a fetch Response. */
async function downloadFromResponse(res: Response, fallbackName: string) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fallbackName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BrandCardDownloads({
  brandJsonUrl,
  jobId,
  getIdToken,
}: BrandCardDownloadsProps) {
  const [downloading, setDownloading] = useState(false);
  const [jsonDownloading, setJsonDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Download brand JSON via our server-side proxy to avoid CORS issues. */
  const handleJsonDownload = useCallback(async () => {
    setJsonDownloading(true);
    setError(null);
    try {
      const freshToken = await getIdToken();
      const res = await fetch(
        `/api/tools/brand-scraper/jobs/${jobId}/download/json`,
        { headers: { Authorization: `Bearer ${freshToken}` } },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? `Download failed (${res.status})`);
        return;
      }
      await downloadFromResponse(res, `brand-${jobId}.json`);
    } catch {
      setError("An unexpected error occurred downloading JSON.");
    } finally {
      setJsonDownloading(false);
    }
  }, [jobId, getIdToken]);

  /** Download assets ZIP via our server-side proxy. */
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
        // Check if the response is JSON (error) or binary (success sent as non-200)
        const contentType = res.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
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
        } else {
          setError(`Download failed (${res.status})`);
        }
        return;
      }

      await downloadFromResponse(res, `brand-assets-${jobId}.zip`);
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
