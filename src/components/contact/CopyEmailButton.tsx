"use client";

import { useState, useCallback } from "react";
import { trackEvent } from "@/lib/analytics";

interface CopyEmailButtonProps {
  email: string;
  /** Render as a standalone CTA button (hero style) vs inline text */
  variant?: "cta" | "inline";
}

export function CopyEmailButton({
  email,
  variant = "inline",
}: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      trackEvent("copy_email", { email });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Email is still visible as text; silently ignore clipboard errors
    }
  }, [email]);

  if (variant === "cta") {
    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={
          copied ? "Email copied to clipboard" : `Copy ${email} to clipboard`
        }
        className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-surface px-5 py-3 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold min-h-[44px]"
      >
        {/* Clipboard icon */}
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
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
          />
        </svg>
        {copied ? "Copied!" : "Copy Email"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={
        copied ? "Email copied to clipboard" : `Copy ${email} to clipboard`
      }
      className="inline-flex items-center gap-2 text-primary hover:text-gold transition-colors"
    >
      {email}
      <span className="text-sm text-text-tertiary">
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </button>
  );
}
