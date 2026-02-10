"use client";

import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import type { AnalyticsPageData, HomePageData, TransactionsPageData } from "@/lib/envelopes/types";
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
