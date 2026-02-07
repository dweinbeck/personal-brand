"use client";

import { useEffect } from "react";

/**
 * Global error boundary for errors in the root layout.
 * This catches errors that error.tsx cannot (e.g., in layout.tsx itself).
 *
 * Must include its own <html> and <body> tags since it replaces the entire page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (placeholder for error reporting service)
    // TODO: Replace with error reporting service (Sentry, LogRocket, etc.)
    console.error("[Global Error Boundary]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-white font-sans antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
          <div className="text-center max-w-lg">
            {/* Error code */}
            <p className="text-red-500 font-mono text-sm font-medium tracking-wider mb-4">
              500 ERROR
            </p>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-lg mb-8">
              We encountered a critical error. Try refreshing the page, or head
              back home if the problem persists.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => reset()}
                type="button"
                className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-lg border-2 border-gray-200 text-gray-900 hover:border-gray-400 transition-colors"
              >
                Go to Homepage
              </a>
            </div>

            {/* Contact link */}
            <p className="text-gray-500 text-sm">
              Still having trouble?{" "}
              <a
                href="/contact"
                className="text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-2"
              >
                Contact me
              </a>
            </p>

            {/* Error digest for debugging (only in development) */}
            {process.env.NODE_ENV === "development" && error.digest && (
              <p className="mt-6 text-xs text-gray-400 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
