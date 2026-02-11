"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { JobStatusIndicator } from "@/components/admin/brand-scraper/JobStatusIndicator";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import type { BillingMeResponse } from "@/lib/billing/types";
import { useJobStatus } from "@/lib/brand-scraper/hooks";
import {
  brandTaxonomySchema,
  type ScrapeJobSubmission,
} from "@/lib/brand-scraper/types";
import { BrandCard } from "./BrandCard";
import { ScrapeHistory } from "./ScrapeHistory";
import { ScrapeProgressPanel } from "./ScrapeProgressPanel";

const API_BASE = "/api/tools/brand-scraper";

/** Extract a displayable error message from the new error shape (object) or legacy string. */
function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unknown error occurred.";
}

function BrandScraperContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId");
  const hasInitialized = useRef(false);

  const [billing, setBilling] = useState<BillingMeResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    error: pollError,
    isPolling,
    isTerminal,
    isTimedOut,
    reset,
  } = useJobStatus(jobId, token, API_BASE);

  // Load billing info
  const fetchBilling = useCallback(async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const t = await user.getIdToken();
      const res = await fetch("/api/billing/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) setBilling(await res.json());
    } catch {
      // Non-critical — we'll still show the form
    } finally {
      setBillingLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const scraperPricing = billing?.pricing.find(
    (p) => p.toolKey === "brand_scraper",
  );
  const creditCost = scraperPricing?.creditsPerUse ?? 50;
  const hasEnough = billing ? billing.balanceCredits >= creditCost : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const idempotencyKey = crypto.randomUUID();

      const res = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "X-Idempotency-Key": idempotencyKey,
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

      const job = (await res.json()) as ScrapeJobSubmission & {
        balanceAfter?: number;
      };
      setToken(idToken);
      setJobId(job.job_id);
      setUrl("");

      // Update local balance
      if (billing && job.balanceAfter !== undefined) {
        setBilling({ ...billing, balanceCredits: job.balanceAfter });
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewScrape = useCallback(() => {
    reset();
    setJobId(null);
    setToken(null);
    setError(null);
    fetchBilling();
  }, [reset, fetchBilling]);

  // Auto-enter results view when ?jobId=xxx query param is present
  useEffect(() => {
    if (initialJobId && user && !hasInitialized.current) {
      hasInitialized.current = true;
      user.getIdToken().then((idToken) => {
        setToken(idToken);
        setJobId(initialJobId);
      });
    }
  }, [initialJobId, user]);

  // Handle "View Results" from history list
  const handleViewResults = useCallback(
    async (historyJobId: string) => {
      if (!user) return;
      const idToken = await user.getIdToken();
      setToken(idToken);
      setJobId(historyJobId);
      setError(null);
    },
    [user],
  );

  const inputStyles =
    "block w-full rounded-lg border border-border px-3 py-2 shadow-sm transition-colors focus:border-gold focus:ring-1 focus:ring-gold min-h-[44px]";

  // Defensive parsing of the result
  const parsed = data?.result
    ? brandTaxonomySchema.safeParse(data.result)
    : null;
  const hasValidResult =
    (data?.status === "succeeded" || data?.status === "partial") &&
    parsed?.success === true;
  const events = data?.pipeline_meta?.events ?? [];

  const hasUnparseableResult =
    (data?.status === "succeeded" || data?.status === "partial") &&
    data?.result &&
    parsed?.success === false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold text-primary font-display">
        Brand Scraper
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        Extract colors, fonts, logos, and assets from any website.
      </p>

      {/* Balance + cost info */}
      {!billingLoading && billing && (
        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
          <span className="text-text-secondary">
            Balance:{" "}
            <strong className="text-primary">
              {billing.balanceCredits.toLocaleString()} credits
            </strong>
          </span>
          <span className="text-text-tertiary">|</span>
          <span className="text-text-secondary">
            Cost per scrape: <strong>{creditCost} credits</strong> ($
            {(creditCost / 100).toFixed(2)})
          </span>
        </div>
      )}

      {/* Insufficient credits warning */}
      {!billingLoading && billing && !hasEnough && !jobId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 text-sm text-amber-800">
          <p className="font-medium mb-1">Insufficient credits</p>
          <p>
            You need {creditCost} credits to run a scrape. Your balance is{" "}
            {billing.balanceCredits}.{" "}
            <Link
              href="/billing"
              className="text-primary underline hover:text-primary-hover"
            >
              Buy credits
            </Link>
          </p>
        </div>
      )}

      {/* URL form + history — only when no active job */}
      {!jobId && (
        <>
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
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting || !hasEnough}
            >
              {submitting ? "Submitting..." : `Scrape (${creditCost} credits)`}
            </Button>
          </form>
          <ScrapeHistory onViewResults={handleViewResults} />
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Job status + results */}
      {jobId && (
        <>
          <JobStatusIndicator
            status={data?.status ?? "queued"}
            isPolling={isPolling}
            isTimedOut={isTimedOut}
            error={pollError?.message ?? null}
          />

          {/* Live progress panel during active scraping */}
          {jobId && !isTerminal && !isTimedOut && events.length > 0 && (
            <div className="mt-6">
              <ScrapeProgressPanel events={events} />
            </div>
          )}

          {/* Parsed result — render Brand Card */}
          {hasValidResult && parsed.success && token && (
            <div className="mt-6">
              <BrandCard
                result={parsed.data}
                brandJsonUrl={data.brand_json_url ?? undefined}
                jobId={jobId}
                token={token}
              />
            </div>
          )}

          {/* Unparseable result — fallback with download link */}
          {hasUnparseableResult && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              <p className="font-medium mb-2">
                We extracted brand data but could not display it.
              </p>
              <p className="text-text-secondary mb-4">
                The data format was unexpected. You can download the raw JSON to
                inspect it manually.
              </p>
              {data.brand_json_url && (
                <Button
                  href={data.brand_json_url}
                  variant="secondary"
                  size="sm"
                  download="brand.json"
                >
                  Download Brand JSON
                </Button>
              )}
            </div>
          )}

          {data?.status === "failed" && data.error && (
            <div className="mt-4 text-sm">
              <p className="text-red-600">{getErrorMessage(data.error)}</p>
              <p className="text-text-secondary mt-1">
                Credits have been automatically refunded.
              </p>
            </div>
          )}

          {isTerminal && (
            <div className="mt-6">
              <Button variant="secondary" onClick={handleNewScrape}>
                Scrape Another URL
              </Button>
            </div>
          )}

          {isTimedOut && !isTerminal && (
            <div className="mt-4">
              <Button variant="secondary" onClick={() => reset()}>
                Check Again
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function UserBrandScraperPage() {
  return (
    <AuthGuard>
      <BrandScraperContent />
    </AuthGuard>
  );
}
