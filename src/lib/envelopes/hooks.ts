"use client";

import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import type {
  AnalyticsPageData,
  BillingStatus,
  EnvelopeProfileInput,
  EnvelopeTransfer,
  HomePageData,
  IncomeEntry,
  TransactionsPageData,
} from "@/lib/envelopes/types";
import { envelopeFetch } from "./api";

export function useEnvelopes() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<HomePageData>(
    user ? "/api/envelopes" : null,
    async (url: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      return envelopeFetch<HomePageData>(url, token);
    },
  );

  return { data, error, isLoading, mutate };
}

export function useTransactions(weekStart: string, weekEnd: string) {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<TransactionsPageData>(
    user
      ? `/api/envelopes/transactions?weekStart=${weekStart}&weekEnd=${weekEnd}`
      : null,
    async (url: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      return envelopeFetch<TransactionsPageData>(url, token);
    },
  );

  return { data, error, isLoading, mutate };
}

type TransfersPageData = {
  transfers: EnvelopeTransfer[];
  billing: BillingStatus;
};

export function useTransfers(weekStart: string, weekEnd: string) {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<TransfersPageData>(
    user
      ? `/api/envelopes/transfers?weekStart=${weekStart}&weekEnd=${weekEnd}`
      : null,
    async (url: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      return envelopeFetch<TransfersPageData>(url, token);
    },
  );

  return { data, error, isLoading, mutate };
}

export function useEnvelopeProfile() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } =
    useSWR<EnvelopeProfileInput | null>(
      user ? "/api/envelopes/profile" : null,
      async (url: string) => {
        const token = await user?.getIdToken();
        if (!token) throw new Error("Not authenticated");
        try {
          return await envelopeFetch<EnvelopeProfileInput>(url, token);
        } catch (err: unknown) {
          // 404 means profile doesn't exist yet -- return null, not error
          if (
            err instanceof Error &&
            err.message.includes("Profile not found")
          ) {
            return null;
          }
          throw err;
        }
      },
    );

  return {
    profile: data,
    isProfileMissing: data === null && !isLoading && !error,
    error,
    isLoading,
    mutate,
  };
}

type IncomePageData = {
  entries: IncomeEntry[];
  billing: BillingStatus;
};

export function useIncome(weekStart: string, weekEnd: string) {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR<IncomePageData>(
    user
      ? `/api/envelopes/income?weekStart=${weekStart}&weekEnd=${weekEnd}`
      : null,
    async (url: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      return envelopeFetch<IncomePageData>(url, token);
    },
  );

  const entries = data?.entries ?? [];
  const totalCents = entries.reduce((sum, e) => sum + e.amountCents, 0);

  return { entries, totalCents, error, isLoading, mutate };
}

export function useAnalytics() {
  const { user } = useAuth();

  const { data, error, isLoading } = useSWR<AnalyticsPageData>(
    user ? "/api/envelopes/analytics" : null,
    async (url: string) => {
      const token = await user?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      return envelopeFetch<AnalyticsPageData>(url, token);
    },
  );

  return { data, error, isLoading };
}
