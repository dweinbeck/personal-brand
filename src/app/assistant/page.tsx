import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
  description:
    "An AI-powered assistant for exploring Dan's work and expertise.",
};

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">
        AI Assistant
      </h1>
      <p className="mt-4 text-text-secondary">
        An AI-powered assistant for exploring Dan's work and expertise.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 text-center">
        <h2 className="text-lg font-medium text-text-primary">
          Coming Soon
        </h2>
        <p className="mt-2 text-sm text-text-tertiary">
          An interactive AI assistant is in development. Stay tuned.
        </p>
      </div>
    </div>
  );
}
