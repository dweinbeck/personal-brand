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

  let Content: React.ComponentType;
  let metadata: TutorialMeta;

  try {
    const mod = await import(`@/content/building-blocks/${slug}.mdx`);
    Content = mod.default;
    metadata = mod.metadata as TutorialMeta;
  } catch {
    notFound();
  }

  const date = new Date(metadata.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">{metadata.title}</h1>
        <p className="mt-2 text-gray-600">{metadata.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <time dateTime={metadata.publishedAt}>{date}</time>
          {metadata.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>
      <div className="prose prose-gray max-w-none">
        <Content />
      </div>
    </article>
  );
}
