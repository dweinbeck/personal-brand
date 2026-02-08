import type { Metadata } from "next";
import { ProjectsFilter } from "@/components/projects/ProjectsFilter";
import { fetchAllProjects } from "@/lib/github";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse current and past projects by Dan Weinbeck across AI, data, fintech, and product development.",
};

export const revalidate = 3600; // 1 hour ISR

export default async function ProjectsPage() {
  const projects = await fetchAllProjects();

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
