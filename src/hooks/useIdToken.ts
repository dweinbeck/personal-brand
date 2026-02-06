"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";

/**
 * Returns a function that gets the current user's Firebase ID token.
 * Use this to authenticate API requests.
 */
export function useIdToken() {
  const { user } = useAuth();

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, [user]);

  return getIdToken;
}

/**
 * Helper to create Authorization header with Bearer token.
 */
export async function authHeaders(
  getIdToken: () => Promise<string | null>,
): Promise<HeadersInit> {
  const token = await getIdToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
