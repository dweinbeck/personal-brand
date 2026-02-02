import Link from "next/link";
import type { Tutorial } from "@/lib/tutorials";

interface TutorialCardProps {
  tutorial: Tutorial;
}

export function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <Link
      href={`/building-blocks/${tutorial.slug}`}
      className="block rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 motion-safe:hover:-translate-y-0.5"
    >
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
    </Link>
  );
}
