"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import type { AssetManifestEntry } from "@/lib/brand-scraper/types";
import { AssetGrid } from "./AssetGrid";

const API_BASE = "/api/tools/brand-scraper";

const TERMINAL_STATUSES = ["succeeded", "partial", "failed"];

function AssetsPageContent({ jobId }: { jobId: string }) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetManifestEntry[] | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Get fresh token
  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user]);

  // Fetch job status (which includes assets_manifest)
  useEffect(() => {
    if (!token) return;

    async function fetchJob() {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          setError(
            "Job not found. It may have been deleted or the ID is invalid.",
          );
          return;
        }

        if (!res.ok) {
          setError(`Failed to load job (${res.status}).`);
          return;
        }

        const data = (await res.json()) as {
          status: string;
          result?: { source?: { site_url?: string } };
          assets_manifest?: { assets?: AssetManifestEntry[] };
        };

        setJobStatus(data.status);
        setAssets(data.assets_manifest?.assets ?? []);
        setSiteUrl(data.result?.source?.site_url ?? null);
      } catch {
        setError("An unexpected error occurred while loading assets.");
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [jobId, token]);

  // Zip download handler — gets fresh token to handle expiry
  const handleZipDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);

    try {
      const freshToken = await user?.getIdToken();
      if (!freshToken) {
        setDownloadError("Authentication required.");
        return;
      }

      const res = await fetch(`${API_BASE}/jobs/${jobId}/assets/zip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}` },
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDownloadError(body?.error ?? `Download failed (${res.status})`);
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
      setDownloadError("An unexpected error occurred.");
    } finally {
      setDownloading(false);
    }
  }, [jobId, user]);

  // Derive hostname for subtitle
  const hostname = siteUrl
    ? (() => {
        try {
          return new URL(siteUrl).hostname;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/apps/brand-scraper"
        className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-hover transition-colors duration-200 mb-6"
      >
        &larr; Back to Brands
      </Link>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-primary font-display">
        Brand Assets
      </h1>
      {hostname && (
        <p className="text-sm text-text-secondary mt-1">{hostname}</p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-8 flex items-center justify-center min-h-[30vh]">
          <p className="text-text-tertiary text-sm">Loading assets...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p className="font-medium mb-2">Unable to load assets</p>
          <p>{error}</p>
          <Link
            href="/apps/brand-scraper"
            className="inline-block mt-4 text-sm font-medium text-gold hover:text-gold-hover transition-colors"
          >
            &larr; Back to Brands
          </Link>
        </div>
      )}

      {/* Processing state */}
      {!loading &&
        !error &&
        jobStatus &&
        !TERMINAL_STATUSES.includes(jobStatus) && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            <p className="font-medium mb-2">Job still processing</p>
            <p>
              This job is still processing. Check back soon to view the
              extracted assets.
            </p>
            <Link
              href="/apps/brand-scraper"
              className="inline-block mt-4 text-sm font-medium text-gold hover:text-gold-hover transition-colors"
            >
              &larr; Back to Brands
            </Link>
          </div>
        )}

      {/* Empty assets */}
      {!loading &&
        !error &&
        jobStatus &&
        TERMINAL_STATUSES.includes(jobStatus) &&
        assets &&
        assets.length === 0 && (
          <div className="mt-8 rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary">
            <p className="font-medium mb-2 text-text-primary">
              No assets found
            </p>
            <p>No assets were extracted for this job.</p>
            <Link
              href="/apps/brand-scraper"
              className="inline-block mt-4 text-sm font-medium text-gold hover:text-gold-hover transition-colors"
            >
              &larr; Back to Brands
            </Link>
          </div>
        )}

      {/* Success — assets available */}
      {!loading &&
        !error &&
        jobStatus &&
        TERMINAL_STATUSES.includes(jobStatus) &&
        assets &&
        assets.length > 0 && (
          <>
            {/* Zip download section */}
            <div className="mt-6 flex items-center gap-4">
              <Button
                variant="primary"
                size="sm"
                onClick={handleZipDownload}
                disabled={downloading}
              >
                {downloading ? "Preparing download..." : "Download Zip File"}
              </Button>
              <span className="text-xs text-text-tertiary">
                {assets.length} asset{assets.length !== 1 ? "s" : ""}
              </span>
            </div>
            {downloadError && (
              <p className="mt-2 text-xs text-red-600">{downloadError}</p>
            )}

            {/* Asset grid */}
            <div className="mt-6">
              <AssetGrid assets={assets} />
            </div>
          </>
        )}
    </div>
  );
}

export function AssetsPage({ jobId }: { jobId: string }) {
  return (
    <AuthGuard>
      <AssetsPageContent jobId={jobId} />
    </AuthGuard>
  );
}
