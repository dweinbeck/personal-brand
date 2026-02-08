"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase-client";

const provider = new GoogleAuthProvider();

export function AuthButton() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  if (loading) return null;

  if (user) {
    const initial = (
      user.displayName?.[0] ??
      user.email?.[0] ??
      "U"
    ).toUpperCase();
    return (
      <div className="relative ml-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold border border-gold hover:bg-primary-hover transition-colors"
          aria-label="Account menu"
        >
          {initial}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-28 rounded-md bg-surface shadow-lg ring-1 ring-border py-1 z-50">
            <button
              type="button"
              onClick={() => {
                signOut(getFirebaseAuth());
                setMenuOpen(false);
              }}
              className="block w-full px-4 py-2 text-sm text-text-secondary hover:bg-gold-light text-left"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleSignIn = async () => {
    try {
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (error) {
      console.error("Sign-in error:", error);
      alert(
        `Sign-in failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      className="ml-2 px-3 py-1.5 text-sm font-medium rounded-full border border-gold/40 text-text-secondary hover:bg-gold-light hover:text-primary transition-all"
    >
      Sign In
    </button>
  );
}
