import type { Tutorial } from "@/lib/tutorials";
import Link from "next/link";

interface TutorialCardProps {
  tutorial: Tutorial;
}

const tagColors: Record<string, string> = {
  Git: "bg-gold-light text-gold-hover border-gold",
  GitHub: "bg-gold-light text-gold-hover border-gold",
  DevOps: "bg-primary/10 text-primary border-primary/40",
  Workflow: "bg-[#8B1E3F]/10 text-[#8B1E3F] border-[#8B1E3F]/30",
};

function getTagColor(tag: string): string {
  return tagColors[tag] ?? "bg-primary/10 text-primary border-primary/40";
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  const primaryTag = tutorial.metadata.tags[0];

  return (
    <Link
      href={`/building-blocks/${tutorial.slug}`}
      className="relative rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 group cursor-pointer block"
    >
      {/* Topic badge */}
      {primaryTag && (
        <span
          className={`absolute top-4 right-4 px-2.5 py-0.5 text-xs font-medium rounded-full border ${getTagColor(primaryTag)}`}
        >
          {primaryTag}
        </span>
      )}

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary pr-24 group-hover:text-gold transition-colors duration-200">
        {tutorial.metadata.title}
      </h3>

      <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
        {tutorial.metadata.description}
      </p>

      {/* Additional tags */}
      {tutorial.metadata.tags.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {tutorial.metadata.tags.slice(1).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <span className="mt-5 inline-block text-sm font-medium text-gold group-hover:text-gold-hover transition-colors duration-200">
        Read Tutorial &rarr;
      </span>
    </Link>
  );
}
