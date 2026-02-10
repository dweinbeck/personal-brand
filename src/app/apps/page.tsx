import type { Metadata } from "next";
import { AppCard } from "@/components/apps/AppCard";
import { getApps } from "@/data/apps";

export const metadata: Metadata = {
  title: "Apps",
  description:
    "Discover and access Dan's web-based tools — from brand identity extraction to budget management.",
};

export default function AppsPage() {
  const apps = getApps();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Apps</h1>
      <p className="mt-2 text-text-secondary">
        Web-based tools built for real-world use. Some are live, others are on
        the way.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </div>
  );
}
