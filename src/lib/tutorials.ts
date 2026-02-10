import fs from "node:fs";
import path from "node:path";

export interface TutorialMeta {
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
}

export interface Tutorial {
  slug: string;
  metadata: TutorialMeta;
}

const CONTENT_DIR = path.join(
  process.cwd(),
  "src",
  "content",
  "building-blocks",
);

function extractMetadataFromSource(source: string): TutorialMeta | null {
  const match = source.match(
    /export\s+const\s+metadata\s*=\s*(\{[\s\S]*?\n\})/,
  );
  if (!match) return null;

  try {
    // Use Function constructor to safely evaluate the object literal
    const fn = new Function(`return ${match[1]}`);
    return fn() as TutorialMeta;
  } catch {
    return null;
  }
}

export async function getAllTutorials(): Promise<Tutorial[]> {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"));

  const tutorials: Tutorial[] = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");

    let metadata: TutorialMeta | null = null;

    try {
      const mod = await import(`@/content/building-blocks/${slug}.mdx`);
      metadata = mod.metadata as TutorialMeta;
    } catch {
      // Fallback: extract metadata from file source
      const source = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
      metadata = extractMetadataFromSource(source);
    }

    if (metadata?.title) {
      tutorials.push({ slug, metadata });
    }
  }

  return tutorials.sort(
    (a, b) =>
      new Date(a.metadata.publishedAt).getTime() -
      new Date(b.metadata.publishedAt).getTime(),
  );
}
