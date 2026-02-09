"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase-client";

const provider = new GoogleAuthProvider();

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-text-secondary text-sm">
          Sign in to access this page.
        </p>
        <button
          type="button"
          onClick={() => signInWithPopup(getFirebaseAuth(), provider)}
          className="px-5 py-2.5 text-sm font-medium rounded-full border border-gold/40 text-text-secondary hover:bg-gold-light hover:text-primary transition-all"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
