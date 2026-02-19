"use client";

import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase-client";

const provider = new GoogleAuthProvider();

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <p className="text-text-secondary text-lg">Sign in to access Tasks</p>
        <button
          type="button"
          onClick={() => signInWithRedirect(getFirebaseAuth(), provider)}
          className="px-5 py-2.5 text-sm font-medium rounded-full border border-gold/40 text-text-secondary hover:bg-gold-light hover:text-primary transition-all cursor-pointer"
        >
          Sign in with Google
        </button>
        <Link
          href="/apps/tasks/demo"
          className="text-sm text-text-tertiary hover:text-gold transition-colors"
        >
          or try the demo
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
