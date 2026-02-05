import type { Metadata } from "next";
import type { DetailedProject } from "@/components/projects/DetailedProjectCard";
import { ProjectsFilter } from "@/components/projects/ProjectsFilter";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse current and past projects by Dan Weinbeck across AI, data, fintech, and product development.",
};

const projects: DetailedProject[] = [
  {
    name: "Dave Ramsey Digital Envelope App",
    description:
      "A full-featured budget management app implementing the popular envelope method for personal finance. Users can allocate funds across custom categories, track real-time spending, and manage month-to-month rollovers. Built with React Native for cross-platform support and Firebase for real-time data sync and authentication.",
    tags: ["React Native", "Firebase", "Fintech"],
    status: "In Development",
    dateInitiated: "Oct 2025",
    lastCommit: "Jan 2026",
    visibility: "private",
    detailUrl: "#",
  },
  {
    name: "Chicago Bus Text-Multiplier",
    description:
      "Stop relying on inaccurate bus arrival times and use the only source that's consistently accurate — texting the bus stop number — but with added functionality to accurately assess the quickest route to get somewhere. Integrates with the CTA API and Twilio to provide real-time multi-stop comparisons via SMS.",
    tags: ["Twilio", "Python", "CTA API"],
    status: "Live",
    dateInitiated: "Aug 2025",
    lastCommit: "Jan 2026",
    visibility: "public",
    detailUrl: "#",
  },
  {
    name: "60-Second Lesson",
    description:
      "A micro-learning platform that delivers bite-sized lessons in under a minute. Each lesson is AI-generated based on trending topics and user interests, then reviewed for accuracy. Designed for daily use with push notifications, streak tracking, and spaced repetition to reinforce retention over time.",
    tags: ["Next.js", "AI", "Education"],
    status: "In Development",
    dateInitiated: "Nov 2025",
    lastCommit: "Feb 2026",
    visibility: "private",
    detailUrl: "#",
  },
  {
    name: "Month-Grid Habit Tracker",
    description:
      "A minimalist habit tracker designed specifically for iPhone lock screen widgets. See your entire month at a glance with a simple grid that fills in as you complete habits. Built natively with Swift and WidgetKit for maximum performance and seamless iOS integration.",
    tags: ["Swift", "WidgetKit", "iOS"],
    status: "Planning",
    dateInitiated: "Jan 2026",
    lastCommit: "Jan 2026",
    visibility: "private",
    detailUrl: "#",
  },
  {
    name: "Research Assistant",
    description:
      "Get opinions from multiple LLMs at one time for things that matter. Submit a single prompt and receive structured, side-by-side responses from GPT-4, Claude, and Gemini. Includes source attribution, confidence indicators, and the ability to drill deeper with follow-up questions across all models simultaneously.",
    tags: ["Multi-LLM", "Python", "AI"],
    status: "In Development",
    dateInitiated: "Sep 2025",
    lastCommit: "Feb 2026",
    visibility: "public",
    detailUrl: "#",
  },
  {
    name: "PromptOS",
    description:
      "An intelligence layer that sits between a user and an LLM to optimize outcomes. Automatically rewrites prompts for clarity and specificity, manages context windows, and applies domain-specific templates. Think of it as an operating system for prompt engineering that makes every interaction more effective.",
    tags: ["TypeScript", "AI", "DevTools"],
    status: "Planning",
    dateInitiated: "Dec 2025",
    lastCommit: "Jan 2026",
    visibility: "public",
    detailUrl: "#",
  },
];

export default function ProjectsPage() {
  return (
    <div className="dot-pattern">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Page headline */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            Current and Past Projects
          </h1>
          <p className="mt-3 text-text-secondary max-w-2xl mx-auto">
            Side projects and explorations across AI, data, fintech, and
            product. Each project represents a real problem I wanted to solve.
          </p>
        </div>

        {/* Filter + Grid (client component) */}
        <ProjectsFilter projects={projects} />
      </div>
    </div>
  );
}
