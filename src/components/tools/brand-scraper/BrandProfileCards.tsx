"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import type { ScrapeHistoryEntry } from "@/lib/brand-scraper/types";
import { BrandProfileCard } from "./BrandProfileCard";

type BrandProfileCardsProps = {
  onViewResults: (jobId: string) => void;
};

export function BrandProfileCards({ onViewResults }: BrandProfileCardsProps) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    user?.getIdToken().then(setToken);
  }, [user]);

  const getIdToken = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
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

  const [removingMode, setRemovingMode] = useState(false);

  const { data, mutate } = useSWR<{ entries: ScrapeHistoryEntry[] } | null>(
    token ? "/api/tools/brand-scraper/history" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const entries = data?.entries ?? [];

  // Auto-exit removing mode when list becomes empty
  useEffect(() => {
    if (removingMode && entries.length === 0) {
      setRemovingMode(false);
    }
  }, [removingMode, entries.length]);

  const handleDelete = useCallback(
    async (jobId: string) => {
      try {
        const token = await getIdToken();
        const res = await fetch("/api/tools/brand-scraper/history", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId }),
        });
        if (res.ok) {
          await mutate();
        }
      } catch {
        // Silently fail — user can retry
      }
    },
    [getIdToken, mutate],
  );

  if (entries.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Gold divider matching home page style */}
      <hr className="border-t border-gold/40" />

      {/* Section title with remove toggle */}
      <div className="flex items-center justify-between mt-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary font-display">
          Your Brand Profiles
        </h2>
        <button
          type="button"
          onClick={() => setRemovingMode((prev) => !prev)}
          className={`text-sm transition-colors ${
            removingMode
              ? "text-gold hover:text-gold/80"
              : "text-text-tertiary hover:text-red-500"
          }`}
        >
          {removingMode ? "Done" : "Remove Brands"}
        </button>
      </div>

      {/* 3-wide card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <BrandProfileCard
            key={entry.id}
            jobId={entry.jobId}
            siteUrl={entry.siteUrl}
            status={entry.status}
            createdAt={entry.createdAt}
            getIdToken={getIdToken}
            onViewResults={onViewResults}
            removingMode={removingMode}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
}
