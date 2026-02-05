import type { PlaceholderProject } from "./FeaturedProjects";

interface ProjectCardProps {
  project: PlaceholderProject;
}

const statusColors: Record<PlaceholderProject["status"], string> = {
  Live: "bg-gold-light text-gold-hover border-gold",
  "In Development": "bg-primary/10 text-primary border-primary/40",
  Planning: "bg-[#8B1E3F]/10 text-[#8B1E3F] border-[#8B1E3F]/30",
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 group">
      {/* Status badge */}
      <span
        className={`absolute top-4 right-4 px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[project.status]}`}
      >
        {project.status}
      </span>

      <h3 className="font-semibold text-text-primary pr-24 group-hover:text-gold transition-colors duration-200">
        {project.name}
      </h3>
      <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
        {project.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
