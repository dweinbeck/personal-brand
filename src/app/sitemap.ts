import type { MetadataRoute } from "next";
import { getAccomplishments } from "@/lib/accomplishments";
import { fetchAllProjects } from "@/lib/github";
import { getAllTutorials } from "@/lib/tutorials";

const BASE_URL = "https://dan-weinbeck.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tutorials = await getAllTutorials();
  const projects = await fetchAllProjects();
  const accomplishments = getAccomplishments();

  const now = new Date();

  // Tutorial detail pages
  const tutorialUrls: MetadataRoute.Sitemap = tutorials
    .filter((t) => !Number.isNaN(new Date(t.metadata.publishedAt).getTime()))
    .map((t) => ({
      url: `${BASE_URL}/building-blocks/${t.slug}`,
      lastModified: new Date(t.metadata.publishedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  // Accomplishment detail pages
  const accomplishmentUrls: MetadataRoute.Sitemap = accomplishments.map(
    (a) => ({
      url: `${BASE_URL}/about/${a.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }),
  );

  // Project detail pages from GitHub API
  const projectUrls: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE_URL}/projects/${p.slug}`,
    lastModified: p.pushedAt ? new Date(p.pushedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    // Static pages
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
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
      url: `${BASE_URL}/apps`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/apps/brand-scraper`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
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
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    // Dynamic pages
    ...accomplishmentUrls,
    ...tutorialUrls,
    ...projectUrls,
  ];
}
