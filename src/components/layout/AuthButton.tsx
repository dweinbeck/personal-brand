"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";

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
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  if (loading) return null;

  if (user) {
    const initial = (user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase();
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

  return (
    <button
      type="button"
      onClick={() => signInWithPopup(getFirebaseAuth(), provider)}
      className="ml-2 px-3 py-1.5 text-sm font-medium rounded-full border border-gold/40 text-text-secondary hover:bg-gold-light hover:text-primary transition-all"
    >
      Sign In
    </button>
  );
}
