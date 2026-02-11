import { Button } from "@/components/ui/Button";
import { type AppListing, getApps } from "@/data/apps";

const tagColors: Record<string, string> = {
  Branding: "bg-gold-light text-gold-hover border-gold",
  Finance: "bg-primary/10 text-primary border-primary/40",
};

function getTagColor(tag: string): string {
  return tagColors[tag] ?? "bg-primary/10 text-primary border-primary/40";
}

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AppCard({ app }: { app: AppListing }) {
  const launched = formatDate(app.launchedAt);
  const updated = formatDate(app.updatedAt);
  const hasDates = launched || updated;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
      {/* Topic badge */}
      <span
        className={`self-start px-2.5 py-0.5 text-xs font-medium rounded-full border mb-3 ${getTagColor(app.tag)}`}
      >
        {app.tag}
      </span>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary">
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

      {/* Dates */}
      {hasDates && (
        <p className="mt-4 text-xs text-text-tertiary">
          {launched && <span>Launched {launched}</span>}
          {launched && updated && <span> &middot; </span>}
          {updated && <span>Updated {updated}</span>}
        </p>
      )}

      {/* Action button pinned to bottom */}
      <div className="mt-auto pt-5">
        {app.available ? (
          <Button variant="primary" href={app.href} className="w-full">
            Enter App
          </Button>
        ) : (
          <Button variant="primary" disabled className="w-full">
            Coming Soon
          </Button>
        )}
      </div>
    </div>
  );
}

export function AppsGrid() {
  const apps = getApps();

  return (
    <section className="py-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary text-center">
        Explore my Published Apps
      </h2>
      <p className="text-text-secondary text-center mt-2 mb-10">
        And sign up or sign in to use them
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </section>
  );
}
