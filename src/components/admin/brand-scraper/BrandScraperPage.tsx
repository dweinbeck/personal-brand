"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useJobStatus } from "@/lib/brand-scraper/hooks";
import type { ScrapeJobSubmission } from "@/lib/brand-scraper/types";
import { BrandResultsGallery } from "./BrandResultsGallery";
import { JobStatusIndicator } from "./JobStatusIndicator";
import { UrlSubmitForm } from "./UrlSubmitForm";

export function BrandScraperPage() {
  const { user } = useAuth();
  const [jobId, setJobId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { data, error, isPolling, isTerminal, isTimedOut, reset } =
    useJobStatus(jobId, token);

  const handleJobSubmitted = useCallback(
    async (job: ScrapeJobSubmission) => {
      const idToken = await user?.getIdToken();
      if (idToken) {
        setToken(idToken);
      }
      setJobId(job.job_id);
    },
    [user],
  );

  const handleNewScrape = useCallback(() => {
    reset();
    setJobId(null);
    setToken(null);
  }, [reset]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Brand Scraper</h1>

      {/* Show form when idle (no active job) */}
      {!jobId && <UrlSubmitForm onJobSubmitted={handleJobSubmitted} />}

      {/* Show status and results when a job is active */}
      {jobId && (
        <>
          <JobStatusIndicator
            status={data?.status ?? "queued"}
            isPolling={isPolling}
            isTimedOut={isTimedOut}
            error={error?.message ?? null}
          />

          {/* Show gallery when succeeded and result exists */}
          {data?.status === "succeeded" && data.result && (
            <div className="mt-6">
              <BrandResultsGallery
                result={data.result}
                brandJsonUrl={data.brand_json_url ?? undefined}
                assetsZipUrl={data.assets_zip_url ?? undefined}
              />
            </div>
          )}

          {/* Show partial results gallery too */}
          {data?.status === "partial" && data.result && (
            <div className="mt-6">
              <BrandResultsGallery
                result={data.result}
                brandJsonUrl={data.brand_json_url ?? undefined}
                assetsZipUrl={data.assets_zip_url ?? undefined}
              />
            </div>
          )}

          {/* Show error details when failed */}
          {data?.status === "failed" && data.error && (
            <p className="mt-4 text-sm text-red-600">
              {data.error.message ?? "Job failed"}
            </p>
          )}

          {/* New scrape button when terminal */}
          {isTerminal && (
            <div className="mt-6">
              <Button variant="secondary" onClick={handleNewScrape}>
                Scrape Another URL
              </Button>
            </div>
          )}

          {/* Manual retry when timed out */}
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
