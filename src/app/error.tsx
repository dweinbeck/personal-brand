"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Error boundary for errors within the root layout.
 * Catches React errors and displays a friendly error page.
 *
 * Note: This component must be a Client Component.
 */
export default function ErrorPage({
  error: errorInfo,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (placeholder for error reporting service)
    // TODO: Replace with error reporting service (Sentry, LogRocket, etc.)
    console.error("[Error Boundary]", {
      message: errorInfo.message,
      digest: errorInfo.digest,
      stack: errorInfo.stack,
      timestamp: new Date().toISOString(),
    });
  }, [errorInfo]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16">
      <div className="text-center max-w-lg">
        {/* Error code */}
        <p className="text-red-500 font-mono text-sm font-medium tracking-wider mb-4">
          500 ERROR
        </p>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-lg mb-8">
          We encountered an unexpected error. Try refreshing the page, or head
          back home if the problem persists.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button onClick={() => reset()}>Try Again</Button>
          <Button href="/" variant="secondary">
            Go to Homepage
          </Button>
        </div>

        {/* Contact link */}
        <p className="text-text-tertiary text-sm">
          Still having trouble?{" "}
          <a
            href="/contact"
            className="text-gold hover:text-gold-hover transition-colors underline underline-offset-2"
          >
            Contact me
          </a>
        </p>

        {/* Error digest for debugging (only in development) */}
        {process.env.NODE_ENV === "development" && errorInfo.digest && (
          <p className="mt-6 text-xs text-text-tertiary font-mono">
            Error ID: {errorInfo.digest}
          </p>
        )}
      </div>
    </div>
  );
}
