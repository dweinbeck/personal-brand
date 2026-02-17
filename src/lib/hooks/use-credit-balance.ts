"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getClientFirestore } from "@/lib/firebase-client";

export function useCreditBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const db = getClientFirestore();
    const unsubscribe = onSnapshot(
      doc(db, "billing_users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setBalance(
            (snap.data() as { balanceCredits?: number }).balanceCredits ?? 0,
          );
        } else {
          setBalance(0);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Credit balance listener error:", err);
        setError(err);
        setLoading(false);
        // Don't clear balance — keep last known value so UI doesn't break
      },
    );

    return unsubscribe;
  }, [user]);

  return { balance, loading, error };
}
