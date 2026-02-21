"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { BrandTaxonomy } from "@/lib/brand-scraper/types";
import { brandTaxonomySchema } from "@/lib/brand-scraper/types";

type BrandProfileCardProps = {
  jobId: string;
  siteUrl: string;
  status: string;
  createdAt: string;
  getIdToken: () => Promise<string>;
  onViewResults: (jobId: string) => void;
};

type JobData = {
  status: string;
  result?: BrandTaxonomy;
};

/** Safely extract hostname from a URL string. */
function getHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
}

function SkeletonCard() {
  return (
    <Card variant="default" className="animate-pulse p-4">
      <div className="h-10 w-10 rounded-lg bg-gray-200 mb-3" />
      <div className="h-4 w-3/4 rounded bg-gray-200 mb-2" />
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-6 w-6 rounded bg-gray-200" />
        ))}
      </div>
      <div className="h-3 w-1/2 rounded bg-gray-200" />
    </Card>
  );
}

export function BrandProfileCard({
  jobId,
  siteUrl,
  status,
  createdAt,
  getIdToken,
  onViewResults,
}: BrandProfileCardProps) {
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);

  const isTerminal =
    status === "succeeded" || status === "partial" || status === "failed";

  const fetchJobData = useCallback(async () => {
    if (!isTerminal) {
      setLoading(false);
      return;
    }
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/tools/brand-scraper/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as {
        status: string;
        result?: unknown;
      };
      const parsed = data.result
        ? brandTaxonomySchema.safeParse(data.result)
        : null;
      setJobData({
        status: data.status,
        result: parsed?.success ? parsed.data : undefined,
      });
    } catch {
      // Silently fail — card will show basic info
    } finally {
      setLoading(false);
    }
  }, [jobId, isTerminal, getIdToken]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  if (loading) return <SkeletonCard />;

  const hostname = getHostname(siteUrl);
  const result = jobData?.result;
  const colors = result?.color?.palette?.slice(0, 5) ?? [];
  const fonts = result?.typography?.font_families?.slice(0, 2) ?? [];
  const favicon = result?.assets?.favicons?.[0]?.value?.url;
  const logo = result?.assets?.logos?.[0]?.value?.url;
  const displayImage = logo || favicon;
  const isFailed = status === "failed";

  return (
    <Card
      variant="clickable"
      className="p-4 cursor-pointer group"
      onClick={() => onViewResults(jobId)}
    >
      {/* Logo / Favicon */}
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg border border-border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          {displayImage ? (
            <img
              src={displayImage}
              alt={`${hostname} logo`}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-xs font-bold text-text-tertiary">${hostname.charAt(0).toUpperCase()}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-xs font-bold text-text-tertiary">
              {hostname.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {isFailed && (
          <span className="text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
            Failed
          </span>
        )}
      </div>

      {/* Hostname */}
      <p className="text-sm font-semibold text-text-primary truncate mb-2">
        {hostname}
      </p>

      {/* Color Palette Preview */}
      {colors.length > 0 && (
        <div className="flex gap-1.5 mb-3">
          {colors.map((entry) => (
            <span
              key={entry.value.hex}
              className="h-6 w-6 rounded border border-border shadow-sm"
              style={{ backgroundColor: entry.value.hex }}
              title={entry.value.hex}
            />
          ))}
        </div>
      )}

      {/* Fonts Preview */}
      {fonts.length > 0 && (
        <div className="mb-3">
          {fonts.map((font) => (
            <p
              key={font.value.family}
              className="text-xs text-text-secondary truncate"
            >
              {font.value.family}
              {font.value.usage && (
                <span className="text-text-tertiary ml-1">
                  ({font.value.usage})
                </span>
              )}
            </p>
          ))}
        </div>
      )}

      {/* Date */}
      {createdAt && (
        <p className="text-[11px] text-text-tertiary">
          {format(new Date(createdAt), "MMM d, yyyy")}
        </p>
      )}
    </Card>
  );
}
