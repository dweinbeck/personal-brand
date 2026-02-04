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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          aria-label="Account menu"
        >
          {initial}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-28 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1 z-50">
            <button
              type="button"
              onClick={() => {
                signOut(getFirebaseAuth());
                setMenuOpen(false);
              }}
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
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
      className="ml-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
    >
      Sign In
    </button>
  );
}
