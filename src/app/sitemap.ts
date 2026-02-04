import type { MetadataRoute } from "next";

import { getAllTutorials } from "@/lib/tutorials";

const BASE_URL = "https://dweinbeck.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tutorials = await getAllTutorials();

  const tutorialUrls: MetadataRoute.Sitemap = tutorials
    .filter((t) => !Number.isNaN(new Date(t.metadata.publishedAt).getTime()))
    .map((t) => ({
      url: `${BASE_URL}/building-blocks/${t.slug}`,
      lastModified: new Date(t.metadata.publishedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/projects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/building-blocks`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/writing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/assistant`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...tutorialUrls,
  ];
}
