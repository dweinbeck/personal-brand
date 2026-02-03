"use client";

import { useState } from "react";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Email is still visible as text; silently ignore clipboard errors
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Email copied" : `Copy ${email} to clipboard`}
      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
    >
      {email}
      <span className="text-sm text-gray-500">
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </button>
  );
}
