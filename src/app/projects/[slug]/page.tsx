import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchAllProjects,
  fetchProjectBySlug,
  fetchReadme,
} from "@/lib/github";
import { ReadmeRenderer } from "@/components/projects/ReadmeRenderer";
import { Button } from "@/components/ui/Button";

export const revalidate = 3600; // 1 hour ISR

export async function generateStaticParams() {
  const projects = await fetchAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true; // Allow ISR for new projects

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);

  if (!project) return {};

  return {
    title: `${project.name} | Projects`,
    description: project.description,
    openGraph: {
      title: `${project.name} | Dan Weinbeck`,
      description: project.description,
    },
  };
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string | null): string {
  if (!isoDate) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

const statusColors: Record<string, string> = {
  Live: "bg-gold-light text-gold-hover border-gold",
  "In Development": "bg-primary/10 text-primary border-primary/40",
  Planning: "bg-[#8B1E3F]/10 text-[#8B1E3F] border-[#8B1E3F]/30",
};

const visibilityStyles: Record<string, string> = {
  public: "bg-sage/10 text-sage border-sage/30",
  private: "bg-amber/10 text-amber border-amber/30",
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);

  if (!project) notFound();

  // Fetch README if public repo with valid repo path
  let readme: string | null = null;
  if (project.repo && project.visibility === "public") {
    const [owner, repo] = project.repo.split("/");
    readme = await fetchReadme(owner, repo);
  }

  return (
    <div className="dot-pattern">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Back link */}
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-text-tertiary hover:text-gold transition-colors mb-8"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </Link>

        {/* Project header */}
        <header className="mb-10">
          {/* Status and visibility badges */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusColors[project.status]}`}
            >
              {project.status}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full border capitalize ${visibilityStyles[project.visibility]}`}
            >
              {project.visibility}
            </span>
          </div>

          {/* Project name */}
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-display">
            {project.name}
          </h1>

          {/* Description */}
          <p className="mt-4 text-lg text-text-secondary leading-relaxed">
            {project.description}
          </p>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 font-mono text-sm text-text-tertiary bg-[rgba(27,42,74,0.06)] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Dates */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-text-tertiary">
            <div>
              <span className="font-medium text-text-secondary">Started:</span>{" "}
              {formatDate(project.createdAt)}
            </div>
            <div>
              <span className="font-medium text-text-secondary">
                Last updated:
              </span>{" "}
              {formatDate(project.pushedAt)}
            </div>
            {project.stars > 0 && (
              <div>
                <span className="font-medium text-text-secondary">Stars:</span>{" "}
                {project.stars}
              </div>
            )}
            {project.language && (
              <div>
                <span className="font-medium text-text-secondary">
                  Primary language:
                </span>{" "}
                {project.language}
              </div>
            )}
          </div>

          {/* External links */}
          <div className="mt-8 flex flex-wrap gap-3">
            {project.url && project.visibility === "public" && (
              <Button
                variant="primary"
                size="md"
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </Button>
            )}
            {project.homepage && (
              <Button
                variant="secondary"
                size="md"
                href={project.homepage}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Visit Live Site
              </Button>
            )}
          </div>
        </header>

        {/* README content */}
        {readme && (
          <section className="border-t border-border pt-10">
            <h2 className="text-xl font-semibold text-text-primary mb-6">
              README
            </h2>
            <ReadmeRenderer content={readme} />
          </section>
        )}

        {/* No README fallback for private repos */}
        {!readme && project.visibility === "private" && (
          <section className="border-t border-border pt-10">
            <div className="rounded-lg bg-amber/5 border border-amber/20 p-6 text-center">
              <p className="text-text-secondary">
                This is a private project. README content is not publicly
                available.
              </p>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
