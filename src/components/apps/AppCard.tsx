import { Card } from "@/components/ui/Card";
import { CardButtonLabel } from "@/components/ui/CardButtonLabel";
import type { AppListing } from "@/data/apps";

const tagColor = "bg-gold-light text-gold-hover border-gold";

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
        className={`self-start px-2.5 py-0.5 text-xs font-medium rounded-full border mb-3 ${tagColor}`}
      >
        {app.tag}
      </span>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary group-hover:text-gold transition-colors duration-200">
        {app.title}
      </h3>

      <p className="mt-1 text-sm text-text-secondary">{app.subtitle}</p>

      <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3 overflow-hidden">
        {app.description}
      </p>

      <div className="mt-auto">
        {app.techStack.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {app.techStack.map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-0.5 font-mono text-xs text-text-tertiary bg-[rgba(27,42,74,0.04)] rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        <div className="pt-5">
          <CardButtonLabel>Enter App</CardButtonLabel>
        </div>
      </div>
    </Card>
  );
}
