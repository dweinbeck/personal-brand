"use client";

import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 text-sm bg-primary text-white">
      <div className="flex items-center gap-3">
        <span className="bg-white/20 px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold">
          Demo
        </span>
        <span className="text-white/90">
          You are viewing a demo workspace. Data is temporary and will not be
          saved.
        </span>
      </div>
      <Link
        href="/apps/tasks"
        className="bg-gold text-primary font-medium rounded-[var(--radius-button)] hover:bg-gold-hover transition-colors text-xs px-4 py-1.5"
      >
        Sign Up Free
      </Link>
    </div>
  );
}
