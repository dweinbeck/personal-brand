"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HelpTip } from "@/components/tasks/ui/help-tip";

interface SearchInputProps {
  initialQuery: string;
}

export function SearchInput({ initialQuery }: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/apps/tasks/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-xs font-medium text-text-secondary">
          Search tasks
        </span>
        <HelpTip tipId="search" />
      </div>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-[var(--radius-card)] bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold/50"
        />
      </div>
    </form>
  );
}
