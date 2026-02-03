import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:shadow-md hover:border-gray-300 motion-safe:hover:-translate-y-0.5">
      <h3 className="font-semibold text-gray-900">{project.name}</h3>
      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
        {project.description}
      </p>
      <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
        {project.language && (
          <>
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span>{project.language}</span>
          </>
        )}
        {project.topics.length > 0 &&
          project.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
            >
              {topic}
            </span>
          ))}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
        >
          GitHub <span className="sr-only">repository for {project.name}</span>
        </a>
        {project.homepage && (
          <a
            href={project.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Live Demo <span className="sr-only">for {project.name}</span>
          </a>
        )}
      </div>
    </div>
  );
}
