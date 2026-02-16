import { AppCard } from "@/components/apps/AppCard";
import { getApps } from "@/data/apps";

export function AppsGrid() {
  const apps = getApps();

  return (
    <section className="py-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary text-center">
        Explore my Published Apps
      </h2>
      <p className="text-text-secondary text-center mt-2 mb-8">
        Web-based Tools for Planning and Efficiency
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </section>
  );
}
