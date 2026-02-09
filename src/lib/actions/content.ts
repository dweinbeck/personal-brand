"use server";

import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { verifyAdminToken } from "@/lib/auth/admin";
import {
  type SaveTutorialData,
  saveTutorialSchema,
} from "@/lib/schemas/content";

const CONTENT_DIR = path.join(
  process.cwd(),
  "src",
  "content",
  "building-blocks",
);

export type SaveResult =
  | { success: true; slug: string }
  | { success: false; error: string };

function buildMdxContent(
  meta: {
    title: string;
    description: string;
    publishedAt: string;
    tags: string[];
  },
  body: string,
): string {
  return `export const metadata = {
  title: ${JSON.stringify(meta.title)},
  description: ${JSON.stringify(meta.description)},
  publishedAt: ${JSON.stringify(meta.publishedAt)},
  tags: ${JSON.stringify(meta.tags)},
};

${body}
`;
}

export async function saveTutorial(
  idToken: string,
  data: SaveTutorialData,
): Promise<SaveResult> {
  // 1. Environment gate
  if (process.env.NODE_ENV !== "development") {
    return {
      success: false,
      error: "Content editing is only available in development mode.",
    };
  }

  // 2. Auth verification
  const isAdmin = await verifyAdminToken(idToken);
  if (!isAdmin) {
    return { success: false, error: "Unauthorized." };
  }

  // 3. Input validation
  const parsed = saveTutorialSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  // 4. Path traversal prevention
  const filePath = path.resolve(CONTENT_DIR, `${parsed.data.slug}.mdx`);
  if (!filePath.startsWith(CONTENT_DIR + path.sep)) {
    return { success: false, error: "Invalid slug." };
  }

  // 5. Collision check
  if (existsSync(filePath)) {
    return {
      success: false,
      error: `A tutorial with slug "${parsed.data.slug}" already exists.`,
    };
  }

  // 6. Write file
  try {
    const content = buildMdxContent(parsed.data.metadata, parsed.data.body);
    await writeFile(filePath, content, "utf-8");
  } catch {
    return { success: false, error: "Failed to write tutorial file." };
  }

  // 6b. Write fast companion if provided
  if (parsed.data.fastBody) {
    const fastPath = path.resolve(CONTENT_DIR, `_${parsed.data.slug}-fast.mdx`);
    if (!fastPath.startsWith(CONTENT_DIR + path.sep)) {
      return { success: false, error: "Invalid slug." };
    }
    try {
      await writeFile(fastPath, parsed.data.fastBody, "utf-8");
    } catch {
      return {
        success: false,
        error: "Failed to write fast companion file.",
      };
    }
  }

  // 7. Return success
  return { success: true, slug: parsed.data.slug };
}
