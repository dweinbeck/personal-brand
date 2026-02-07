import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { TutorialMeta } from "@/lib/tutorials";
import { getAllTutorials } from "@/lib/tutorials";

interface PageProps {
  params: Promise<{ slug: string }>;
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

  const date = new Date(metadata.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">
          {metadata.title}
        </h1>
        <p className="mt-2 text-text-secondary">{metadata.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
          <time dateTime={metadata.publishedAt}>{date}</time>
          {metadata.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gold-light px-2.5 py-0.5 text-xs font-medium text-text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="prose prose-neutral max-w-none">
        <Content />
      </div>
    </article>
  );
}
