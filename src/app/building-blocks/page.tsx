import type { Metadata } from "next";
import { TutorialCard } from "@/components/building-blocks/TutorialCard";
import { Card } from "@/components/ui/Card";
import { getAllTutorials } from "@/lib/tutorials";

export const metadata: Metadata = {
  title: "Building Blocks",
  description: "Practical, step-by-step tutorials on common development tasks.",
};

const placeholderCards = [
  {
    title: "Configuring CI/CD Pipelines",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    tags: ["DevOps", "GitHub Actions"],
  },
  {
    title: "Database Migration Strategies",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    tags: ["PostgreSQL", "Prisma"],
  },
  {
    title: "Authentication with OAuth 2.0",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    tags: ["Security", "Auth"],
  },
  {
    title: "Testing React Components",
    description:
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    tags: ["Testing", "React"],
  },
];

export default async function BuildingBlocksPage() {
  const tutorials = await getAllTutorials();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Building Blocks</h1>
      <p className="mt-2 text-text-secondary">
        Practical, step-by-step tutorials on common development tasks.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tutorials.map((tutorial) => (
          <TutorialCard key={tutorial.slug} tutorial={tutorial} />
        ))}
        {placeholderCards.map((card) => (
          <Card key={card.title} variant="default" className="opacity-60">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">{card.title}</h2>
              <span className="text-xs font-medium text-gold bg-gold-light px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{card.description}</p>
            {card.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block rounded-full bg-gold-light px-2.5 py-0.5 text-xs font-medium text-text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
