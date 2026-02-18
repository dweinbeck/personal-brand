"use client";

import { differenceInMinutes, format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import type { ScrapeHistoryEntry } from "@/lib/brand-scraper/types";

/** Threshold in minutes after which a non-terminal job is considered stale. */
const STALE_THRESHOLD_MINUTES = 30;

/** Whether a job is stale (started >30 min ago and never reached terminal). */
function isStaleJob(entry: ScrapeHistoryEntry): boolean {
  if (isTerminalStatus(entry.status)) return false;
  return (
    differenceInMinutes(new Date(), new Date(entry.createdAt)) >=
    STALE_THRESHOLD_MINUTES
  );
}

/** Status dot color based on job status. */
function statusDotColor(status: string, stale: boolean): string {
  if (stale) return "bg-red-500";
  switch (status) {
    case "succeeded":
      return "bg-emerald-500";
    case "partial":
      return "bg-amber-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

/** Whether a status represents a terminal (viewable) job. */
function isTerminalStatus(status: string): boolean {
  return status === "succeeded" || status === "partial" || status === "failed";
}

/** Safely extract hostname from a URL string. */
function getHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
}

export function ScrapeHistory({
  onViewResults,
}: {
  onViewResults: (jobId: string) => void;
}) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user]);

  const fetcher = useCallback(
    async (url: string) => {
      if (!token) return null;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    [token],
  );

  const { data } = useSWR<{ entries: ScrapeHistoryEntry[] } | null>(
    token ? "/api/tools/brand-scraper/history" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const entries = data?.entries ?? [];
  if (entries.length === 0) return null;

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Recent Brand Profiles
      </h2>
      <ul className="space-y-2">
        {entries.map((entry) => {
          const stale = isStaleJob(entry);
          const canView = isTerminalStatus(entry.status) || stale;

          return (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${statusDotColor(entry.status, stale)}`}
                />
                <span className="text-sm text-text-primary font-medium">
                  {getHostname(entry.siteUrl)}
                </span>
                <span className="text-xs text-text-tertiary ml-2">
                  {format(new Date(entry.createdAt), "MMM d, yyyy")}
                </span>
              </div>
              <div>
                {canView ? (
                  <button
                    type="button"
                    onClick={() => onViewResults(entry.jobId)}
                    className="text-xs text-gold hover:text-gold/80 font-medium transition-colors"
                  >
                    View Results
                  </button>
                ) : (
                  <span className="text-xs text-text-tertiary font-medium">
                    In Progress
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
