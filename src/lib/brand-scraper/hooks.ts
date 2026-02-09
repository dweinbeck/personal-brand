"use client";

import { useCallback, useRef, useState } from "react";
import useSWR from "swr";
import type { JobStatus } from "@/lib/brand-scraper/types";

const TERMINAL_STATUSES = ["succeeded", "partial", "failed"];
const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 100;

/**
 * SWR-based polling hook for brand scraper job status.
 *
 * - Polls every 3 seconds while job is active (queued/processing)
 * - Stops automatically on terminal states (succeeded/partial/failed)
 * - Stops after 100 polls (~5 minutes) as timeout protection
 * - Includes Bearer token in every request (admin-protected endpoint)
 */
export function useJobStatus(jobId: string | null, token: string | null) {
  const [pollInterval, setPollInterval] = useState(POLL_INTERVAL_MS);
  const pollCount = useRef(0);

  const fetcher = useCallback(
    async (url: string): Promise<JobStatus> => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Job status fetch failed: ${res.status}`);
      }
      return res.json() as Promise<JobStatus>;
    },
    [token],
  );

  const { data, error, isLoading } = useSWR<JobStatus>(
    jobId && token ? `/api/admin/brand-scraper/jobs/${jobId}` : null,
    fetcher,
    {
      refreshInterval: pollInterval,
      onSuccess(responseData) {
        pollCount.current += 1;
        if (TERMINAL_STATUSES.includes(responseData.status)) {
          setPollInterval(0);
        } else if (pollCount.current >= MAX_POLLS) {
          setPollInterval(0);
        }
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const isTerminal = Boolean(data && TERMINAL_STATUSES.includes(data.status));
  const isPolling = pollInterval > 0 && jobId !== null;
  const isTimedOut = pollCount.current >= MAX_POLLS && !isTerminal;

  const reset = useCallback(() => {
    setPollInterval(POLL_INTERVAL_MS);
    pollCount.current = 0;
  }, []);

  return { data, error, isLoading, isPolling, isTerminal, isTimedOut, reset };
}
