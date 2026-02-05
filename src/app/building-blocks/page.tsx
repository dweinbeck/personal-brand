import type { Metadata } from "next";
import { TutorialCard } from "@/components/building-blocks/TutorialCard";
import { getAllTutorials } from "@/lib/tutorials";

export const metadata: Metadata = {
  title: "Building Blocks",
  description: "Practical, step-by-step tutorials on common development tasks.",
};

export default async function BuildingBlocksPage() {
  const tutorials = await getAllTutorials();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Building Blocks</h1>
      <p className="mt-2 text-text-secondary">
        Practical, step-by-step tutorials on common development tasks.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tutorials.map((tutorial) => (
          <TutorialCard key={tutorial.slug} tutorial={tutorial} />
        ))}
      </div>
    </div>
  );
}
