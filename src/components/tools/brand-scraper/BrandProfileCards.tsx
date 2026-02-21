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

  const { data } = useSWR<{ entries: ScrapeHistoryEntry[] } | null>(
    token ? "/api/tools/brand-scraper/history" : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const entries = data?.entries ?? [];
  if (entries.length === 0) return null;

  return (
    <section className="mt-8">
      {/* Gold divider matching home page style */}
      <hr className="border-t border-gold/40" />

      {/* Section title */}
      <h2 className="text-lg font-semibold text-text-primary text-center mt-6 mb-6 font-display">
        Your Brand Profiles
      </h2>

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
          />
        ))}
      </div>
    </section>
  );
}
