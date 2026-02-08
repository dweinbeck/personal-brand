"use client";

import { useState } from "react";
import { CONTACT_EMAIL } from "@/lib/constants";

type LeadCaptureFlowProps = {
  intent: "hire" | "consult";
  conversationId: string;
  onComplete: () => void;
};

export function LeadCaptureFlow({
  intent,
  conversationId,
  onComplete,
}: LeadCaptureFlowProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timeline, setTimeline] = useState("");
  const [problem, setProblem] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messageId: "lead-capture",
          rating: "up",
          reason: JSON.stringify({ intent, name, email, timeline, problem }),
        }),
      });
    } catch {
      // Non-critical
    }
    setSubmitted(true);
    onComplete();
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-sage/30 bg-sage/5 p-4 text-sm text-text-primary">
        Thanks! Dan will reach out soon. You can also email him directly at{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-primary underline"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold-light p-4">
      <p className="text-sm font-medium text-text-primary mb-3">
        {intent === "hire"
          ? "Interested in working together? Share a few details:"
          : "Looking for consulting help? Tell Dan more:"}
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
          required
        />
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
          required
        />
        <input
          type="text"
          placeholder="Timeline (e.g., ASAP, next month, flexible)"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
        />
        <textarea
          placeholder="Briefly describe your project or problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 resize-none"
        />
        <button
          type="submit"
          disabled={!name || !email}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send to Dan
        </button>
      </form>
    </div>
  );
}
