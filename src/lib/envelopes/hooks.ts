"use client";

import useSWR from "swr";
import { useAuth } from "@/context/AuthContext";
import type { HomePageData } from "@/lib/envelopes/types";
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
