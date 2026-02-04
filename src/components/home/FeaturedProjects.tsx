import { fetchGitHubProjects } from "@/lib/github";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "./ProjectCard";

export async function FeaturedProjects() {
  const projects = await fetchGitHubProjects();
  const featured = projects.slice(0, 6);

  return (
    <section className="py-16 mt-4 motion-safe:animate-fade-in-up">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Featured Projects
        </h2>
      </div>
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
            className="text-blue-600 hover:text-blue-800 underline"
          >
            my GitHub
          </a>{" "}
          in the meantime.
        </p>
      )}
      {featured.length > 0 && (
        <div className="mt-8 text-center">
          <Button variant="secondary" size="sm" href="/projects">
            See all projects →
          </Button>
        </div>
      )}
    </section>
  );
}
