"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import type { ScrapeHistoryEntry } from "@/lib/brand-scraper/types";

/** Status dot color based on job status. */
function statusDotColor(status: string): string {
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
        Recent Scrapes
      </h2>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className={`h-2 w-2 rounded-full ${statusDotColor(entry.status)}`}
              />
              <span className="text-sm text-text-primary font-medium">
                {getHostname(entry.siteUrl)}
              </span>
              <span className="text-xs text-text-tertiary ml-2">
                {format(new Date(entry.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            <div>
              {isTerminalStatus(entry.status) ? (
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
        ))}
      </ul>
    </section>
  );
}
