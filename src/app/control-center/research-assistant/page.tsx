import type { Metadata } from "next";
import { UsageStats } from "@/components/admin/research-assistant/UsageStats";

export const metadata: Metadata = {
  title: "Research Assistant Stats | Control Center",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-primary font-display mb-2">
        Research Assistant Usage
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Usage statistics and recent activity for the Research Assistant tool.
      </p>
      <UsageStats />
    </div>
  );
}
