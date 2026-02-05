import type { Metadata } from "next";
import { TutorialCard } from "@/components/building-blocks/TutorialCard";
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
    tag: "DevOps",
  },
  {
    title: "Database Migration Strategies",
    description:
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    tag: "PostgreSQL",
  },
  {
    title: "Authentication with OAuth 2.0",
    description:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    tag: "Security",
  },
  {
    title: "Testing React Components",
    description:
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    tag: "Testing",
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
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {tutorials.map((tutorial) => (
          <TutorialCard key={tutorial.slug} tutorial={tutorial} />
        ))}
        {placeholderCards.map((card) => (
          <div
            key={card.title}
            className="relative rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 group cursor-pointer"
          >
            <span className="absolute top-4 right-4 px-2.5 py-0.5 text-xs font-medium rounded-full border bg-primary/10 text-primary border-primary/40">
              {card.tag}
            </span>

            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-text-primary pr-24 group-hover:text-gold transition-colors duration-200">
              {card.title}
            </h3>

            <p className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3">
              {card.description}
            </p>

            <span className="mt-5 inline-block text-sm font-medium text-gold group-hover:text-gold-hover transition-colors duration-200">
              Coming Soon &rarr;
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
