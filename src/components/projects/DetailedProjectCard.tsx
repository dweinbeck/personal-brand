import { Button } from "@/components/ui/Button";
import type { EnrichedProject } from "@/types/project";

const statusColors: Record<EnrichedProject["status"], string> = {
  Live: "bg-gold-light text-gold-hover border-gold",
  "In Development": "bg-primary/10 text-primary border-primary/40",
  Planning: "bg-[#8B1E3F]/10 text-[#8B1E3F] border-[#8B1E3F]/30",
};

const visibilityStyles: Record<EnrichedProject["visibility"], string> = {
  public: "bg-sage/10 text-sage border-sage/30",
  private: "bg-amber/10 text-amber border-amber/30",
};

/**
 * Format ISO date string to "Mon YYYY" format
 */
function formatDate(isoDate: string | null): string {
  if (!isoDate) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function DetailedProjectCard({ project }: { project: EnrichedProject }) {
  const detailUrl = `/projects/${project.slug}`;

  return (
    <div className="relative rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 group flex flex-col">
      {/* Top row: status + visibility badges */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[project.status]}`}
        >
          {project.status}
        </span>
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full border capitalize ${visibilityStyles[project.visibility]}`}
        >
          {project.visibility}
        </span>
      </div>

      {/* Project name */}
      <h2 className="text-lg font-semibold text-text-primary group-hover:text-gold transition-colors duration-200">
        {project.name}
      </h2>

      {/* Description paragraph */}
      <p className="mt-3 text-sm text-text-secondary leading-relaxed">
        {project.description}
      </p>

      {/* Tags */}
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

      {/* Date range - using GitHub API dates */}
      <p className="mt-5 text-xs text-text-tertiary">
        Started: {formatDate(project.createdAt)} &bull; Last updated:{" "}
        {formatDate(project.pushedAt)}
      </p>

      {/* View Project button */}
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="primary" size="md" href={detailUrl} className="w-full">
          View Project &rarr;
        </Button>
      </div>
    </div>
  );
}
