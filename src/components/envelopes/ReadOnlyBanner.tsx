"use client";

export function ReadOnlyBanner() {
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-semibold">Read-Only Mode</p>
      <p className="mt-1">
        Your free week has ended. Purchase credits to continue adding and
        editing envelopes and transactions.
      </p>
      <a
        href="/billing"
        className="mt-2 inline-block font-medium text-amber-900 underline hover:no-underline"
      >
        Buy Credits
      </a>
    </div>
  );
}
