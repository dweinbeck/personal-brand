import type { Metadata } from "next";
import { ProjectCard } from "@/components/home/ProjectCard";
import { fetchGitHubProjects } from "@/lib/github";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source projects and experiments by Dan Weinbeck.",
};

export default async function ProjectsPage() {
  const projects = await fetchGitHubProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
      <p className="mt-2 text-gray-600">
        Open-source projects and experiments from my GitHub.
      </p>

      {projects.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-gray-500">
          No projects to display right now. Check back soon or visit{" "}
          <a
            href="https://github.com/dweinbeck"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            my GitHub profile
          </a>
          .
        </p>
      )}
    </div>
  );
}
