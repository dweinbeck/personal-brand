import { Button } from "@/components/ui/Button";
import { fetchAllProjects } from "@/lib/github";
import { ProjectCard } from "./ProjectCard";

export async function FeaturedProjects() {
  const allProjects = await fetchAllProjects();
  const featuredProjects = allProjects.filter((p) => p.featured).slice(0, 6); // Max 6 on homepage

  return (
    <section className="py-8 motion-safe:animate-fade-in-up">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary text-center mb-10">
        Featured Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button variant="secondary" size="sm" href="/projects">
          See all projects
        </Button>
      </div>
    </section>
  );
}
