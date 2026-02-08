import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { TutorialMeta } from "@/lib/tutorials";
import { getAllTutorials } from "@/lib/tutorials";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Calculate reading time based on word count (~200 words per minute)
function calculateReadingTime(slug: string): number {
  try {
    const filePath = join(
      process.cwd(),
      "src/content/building-blocks",
      `${slug}.mdx`,
    );
    const content = readFileSync(filePath, "utf-8");
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  } catch {
    return 5; // Default estimate
  }
}

export async function generateStaticParams() {
  const tutorials = await getAllTutorials();
  return tutorials.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const mod = await import(`@/content/building-blocks/${slug}.mdx`);
    const meta = mod.metadata as TutorialMeta;
    return {
      title: `${meta.title} | Building Blocks`,
      description: meta.description,
      openGraph: {
        title: `${meta.title} | Building Blocks`,
        description: meta.description,
      },
    };
  } catch {
    return {};
  }
}

// Find the "fast way" heading and return its slug for anchor linking
function getQuickVersionAnchor(slug: string): string | null {
  try {
    const filePath = join(
      process.cwd(),
      "src/content/building-blocks",
      `${slug}.mdx`,
    );
    const content = readFileSync(filePath, "utf-8");
    const prefixes = ["## The fast way", "## Quick version", "## TL;DR"];
    for (const prefix of prefixes) {
      const idx = content.indexOf(prefix);
      if (idx !== -1) {
        const lineEnd = content.indexOf("\n", idx);
        const heading = content
          .substring(idx + 3, lineEnd === -1 ? undefined : lineEnd)
          .trim();
        return heading
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default async function TutorialPage({ params }: PageProps) {
  const { slug } = await params;

  let mod: { metadata: TutorialMeta; default: React.ComponentType };
  try {
    mod = await import(`@/content/building-blocks/${slug}.mdx`);
  } catch {
    notFound();
  }

  const metadata = mod.metadata as TutorialMeta;
  const Content = mod.default;
  const readingTime = calculateReadingTime(slug);
  const quickAnchor = getQuickVersionAnchor(slug);

  const date = new Date(metadata.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight">
          {metadata.title}
        </h1>
        <p className="mt-3 text-lg text-text-secondary">
          {metadata.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary">
          <time dateTime={metadata.publishedAt}>{date}</time>
          <span className="text-border">·</span>
          <span>{readingTime} min read</span>
          <span className="text-border">·</span>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-gold-light px-2.5 py-0.5 text-xs font-medium text-text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {quickAnchor && (
          <div className="mt-5">
            <a
              href={`#${quickAnchor}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors"
            >
              <span>⚡</span>
              <span>Jump to fast version</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        )}
      </header>

      <hr className="border-border mb-10" />

      <div className="prose prose-neutral max-w-none">
        <Content />
      </div>
    </article>
  );
}
