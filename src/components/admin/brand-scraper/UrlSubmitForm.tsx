"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import type { ScrapeJobSubmission } from "@/lib/brand-scraper/types";

type UrlSubmitFormProps = {
  onJobSubmitted: (job: ScrapeJobSubmission) => void;
};

const inputStyles =
  "block w-full rounded-lg border border-border px-3 py-2 shadow-sm transition-colors focus:border-gold focus:ring-1 focus:ring-gold min-h-[44px]";

/**
 * URL input form for brand scraper. Submits a URL to the scrape API
 * with the authenticated user's Bearer token.
 */
export function UrlSubmitForm({ onJobSubmitted }: UrlSubmitFormProps) {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError("Not authenticated.");
        return;
      }

      const res = await fetch("/api/admin/brand-scraper/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? `Request failed (${res.status})`);
        return;
      }

      const job = (await res.json()) as ScrapeJobSubmission;
      onJobSubmitted(job);
      setUrl("");
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          className={`flex-1 ${inputStyles}`}
        />
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? "Submitting..." : "Scrape"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
