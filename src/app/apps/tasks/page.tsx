import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Tasks | Daniel Weinbeck",
  description:
    "Full-featured task management with workspaces, projects, sections, tags, subtasks, and board views.",
};

const TASKS_URL = process.env.TASKS_APP_URL || "https://tasks.dan-weinbeck.com";

export default function Page() {
  return (
    <AuthGuard>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold text-primary font-display">
          Tasks
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Full-featured task management with workspaces, projects, sections,
          tags, subtasks, effort scoring, and board views.
        </p>
        <a
          href={TASKS_URL}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold text-sm border border-gold/30 hover:shadow-lg transition-all"
        >
          Launch App
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </AuthGuard>
  );
}
