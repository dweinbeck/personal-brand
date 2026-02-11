import { TutorialCard } from "@/components/building-blocks/TutorialCard";
import { Button } from "@/components/ui/Button";
import { getAllTutorials } from "@/lib/tutorials";

export async function BuildingBlocksCta() {
  const tutorials = await getAllTutorials();

  return (
    <section className="py-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary text-center">
        Want to learn about AI Agent Development?
      </h2>
      <p className="text-text-secondary text-center mt-2 mb-10">
        Start with the building blocks below
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <TutorialCard key={tutorial.slug} tutorial={tutorial} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button variant="secondary" size="sm" href="/building-blocks">
          See all tutorials
        </Button>
      </div>
    </section>
  );
}
