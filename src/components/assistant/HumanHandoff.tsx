"use client";

import { buildMailtoLink } from "@/lib/assistant/handoff";

type HumanHandoffProps = {
  messages: { role: string; content: string }[];
};

export function HumanHandoff({ messages }: HumanHandoffProps) {
  const mailtoUrl = buildMailtoLink(messages);

  return (
    <a
      href={mailtoUrl}
      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      aria-label="Email Dan with conversation summary"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
      </svg>
      Talk to Dan directly
    </a>
  );
}
