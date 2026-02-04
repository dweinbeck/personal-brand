import type { Tutorial } from "@/lib/tutorials";
import { Card } from "@/components/ui/Card";

interface TutorialCardProps {
  tutorial: Tutorial;
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <Card variant="clickable" href={`/building-blocks/${tutorial.slug}`}>
      <h2 className="font-semibold text-gray-900">{tutorial.metadata.title}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {tutorial.metadata.description}
      </p>
      {tutorial.metadata.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tutorial.metadata.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
