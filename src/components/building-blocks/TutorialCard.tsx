import { Card } from "@/components/ui/Card";
import { CardButtonLabel } from "@/components/ui/CardButtonLabel";
import type { Tutorial } from "@/lib/tutorials";

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
    <Card
      variant="clickable"
      href={`/building-blocks/${tutorial.slug}`}
      className="group flex h-full flex-col p-8"
    >
      {/* Topic badge */}
      {primaryTag && (
        <span
          className={`self-start px-2.5 py-0.5 text-xs font-medium rounded-full border mb-3 ${getTagColor(primaryTag)}`}
        >
          {primaryTag}
        </span>
      )}

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary group-hover:text-gold transition-colors duration-200">
        {tutorial.metadata.title}
      </h3>

      <p className="mt-3 flex-1 text-sm text-text-secondary leading-relaxed line-clamp-3">
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

      <div className="mt-auto pt-5">
        <CardButtonLabel>Read Tutorial</CardButtonLabel>
      </div>
    </Card>
  );
}
