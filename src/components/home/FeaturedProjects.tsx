import Link from "next/link";
import { fetchGitHubProjects } from "@/lib/github";
import { ProjectCard } from "./ProjectCard";

export async function FeaturedProjects() {
  const projects = await fetchGitHubProjects();
  const featured = projects.slice(0, 6);

  return (
    <section className="py-16 border-t border-gray-200 motion-safe:animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">
        Featured Projects
      </h2>
      {featured.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          Projects coming soon. Visit{" "}
          <a
            href="https://github.com/dweinbeck"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            my GitHub
          </a>{" "}
          in the meantime.
        </p>
      )}
      {featured.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            href="/projects"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            See all projects →
          </Link>
        </div>
      )}
    </section>
  );
}
