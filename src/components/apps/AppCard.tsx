import { Card } from "@/components/ui/Card";
import { CardButtonLabel } from "@/components/ui/CardButtonLabel";
import type { AppListing } from "@/data/apps";

const tagColors: Record<string, string> = {
  Branding: "bg-gold-light text-gold-hover border-gold",
  Finance: "bg-primary/10 text-primary border-primary/40",
};

function getTagColor(tag: string): string {
  return tagColors[tag] ?? "bg-primary/10 text-primary border-primary/40";
}

interface AppCardProps {
  app: AppListing;
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Card
      variant="clickable"
      href={app.href}
      className="group flex h-full flex-col p-8"
    >
      {/* Topic badge */}
      <span
        className={`self-start px-2.5 py-0.5 text-xs font-medium rounded-full border mb-3 ${getTagColor(app.tag)}`}
      >
        {app.tag}
      </span>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary group-hover:text-gold transition-colors duration-200">
        {app.title}
      </h3>

      <p className="mt-1 text-sm text-text-secondary">{app.subtitle}</p>

      <p className="mt-3 flex-1 text-sm text-text-secondary leading-relaxed line-clamp-3">
        {app.description}
      </p>

      {/* Tech stack tags */}
      <div className="mt-5 flex flex-wrap gap-2">
        {app.techStack.map((tech) => (
          <span
            key={tech}
            className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-5">
        <CardButtonLabel>Enter App</CardButtonLabel>
      </div>
    </Card>
  );
}
