import Link from "next/link";
import type { Project } from "@/types/project";
import { ProjectCard } from "./ProjectCard";

const FEATURED_PROJECTS: Project[] = [
  {
    name: "personal-brand",
    description:
      "Personal website built with Next.js 16, React 19, and Tailwind CSS v4",
    language: "TypeScript",
    stars: 0,
    url: "https://github.com/dweinbeck/personal-brand",
    topics: ["nextjs", "typescript", "tailwind"],
  },
  {
    name: "ai-agent-framework",
    description:
      "Lightweight framework for building practical AI agents with tool use and memory",
    language: "Python",
    stars: 12,
    url: "https://github.com/dweinbeck",
    topics: ["ai", "agents", "python"],
  },
  {
    name: "data-pipeline-toolkit",
    description:
      "ETL pipeline toolkit for automated data extraction, transformation, and loading",
    language: "Python",
    stars: 8,
    url: "https://github.com/dweinbeck",
    topics: ["data", "etl", "automation"],
  },
  {
    name: "experiment-tracker",
    description:
      "A/B testing and experimentation platform for tracking metrics and outcomes",
    language: "TypeScript",
    stars: 5,
    url: "https://github.com/dweinbeck",
    topics: ["experimentation", "analytics", "react"],
  },
  {
    name: "ux-analytics-dashboard",
    description:
      "Real-time UX analytics dashboard with heatmaps and session replay",
    language: "TypeScript",
    stars: 3,
    url: "https://github.com/dweinbeck",
    topics: ["ux", "analytics", "dashboard"],
  },
  {
    name: "automation-scripts",
    description:
      "Collection of automation scripts for development workflow optimization",
    language: "Python",
    stars: 2,
    url: "https://github.com/dweinbeck",
    topics: ["automation", "scripts", "devtools"],
  },
];

export function FeaturedProjects() {
  return (
    <section className="py-16 border-t border-gray-200 motion-safe:animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Featured Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURED_PROJECTS.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          See all projects →
        </Link>
      </div>
    </section>
  );
}
