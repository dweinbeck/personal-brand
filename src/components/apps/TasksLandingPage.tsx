"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase-client";

const provider = new GoogleAuthProvider();

const features = [
  {
    name: "Effort Scoring",
    description:
      "Prioritize tasks with 1-5 effort points and sort by what matters",
    icon: (
      <svg
        className="h-5 w-5 text-gold"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.061L5.05 4.111a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 0 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-7 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 10Zm11.25-.75a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Zm-6.188 5.828a.75.75 0 0 1 1.061-1.06l1.06 1.06a.75.75 0 0 1-1.06 1.061l-1.06-1.06Zm-3.124-1.06a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 1 1-1.061-1.06l1.06-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: "Projects & Sections",
    description: "Organize work into projects with collapsible sections",
    icon: (
      <svg
        className="h-5 w-5 text-gold"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.26a3.235 3.235 0 0 1 1.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM3.75 9A1.75 1.75 0 0 0 2 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-4.5A1.75 1.75 0 0 0 16.25 9H3.75Z" />
      </svg>
    ),
  },
  {
    name: "Board & List Views",
    description: "Switch between Kanban board and list views for any project",
    icon: (
      <svg
        className="h-5 w-5 text-gold"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.166a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: "Weekly Credits",
    description: "100 free credits per week with first week on the house",
    icon: (
      <svg
        className="h-5 w-5 text-gold"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function TasksLandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold text-primary font-display">
          Tasks
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Full-featured task management with workspaces, projects, sections,
          tags, subtasks, effort scoring, and board views.
        </p>
        <Button variant="primary" href="/apps/tasks">
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
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold text-primary font-display">
        Tasks
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        Full-featured task management with workspaces, projects, sections, tags,
        subtasks, effort scoring, and board views.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {features.map((feature) => (
          <Card key={feature.name} variant="default">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{feature.icon}</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {feature.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" href="/apps/tasks/demo">
          Try Demo
        </Button>
        <button
          type="button"
          onClick={() => signInWithPopup(getFirebaseAuth(), provider)}
          className="px-5 py-2.5 text-sm font-medium rounded-full border border-gold/40 text-text-secondary hover:bg-gold-light hover:text-primary transition-all"
        >
          Sign in for Full Access
        </button>
      </div>
    </div>
  );
}
