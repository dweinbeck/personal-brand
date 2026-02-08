"use client";

import { useCallback } from "react";
import { trackEvent } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/constants";

export function EmailDanButton() {
  const handleClick = useCallback(() => {
    trackEvent("mailto_click", { email: CONTACT_EMAIL });
  }, []);

  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-primary to-primary-hover px-5 py-3 text-sm font-medium text-white border border-gold/40 shadow-lg shadow-[rgba(27,42,74,0.20)] transition-all duration-200 hover:shadow-xl hover:shadow-[rgba(200,165,90,0.20)] hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold min-h-[44px]"
    >
      {/* Mail icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      Email Dan
    </a>
  );
}
