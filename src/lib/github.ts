import projectConfig from "@/data/projects.json";
import type {
  ProjectConfig,
  EnrichedProject,
  Project,
} from "@/types/project";

// GitHub API response interface
interface GitHubRepoResponse {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  topics: string[];
  created_at: string;
  pushed_at: string;
  visibility: string;
  private: boolean;
}

// Legacy interface for backwards compatibility
interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  fork: boolean;
  topics: string[];
}

const GITHUB_API_URL =
  "https://api.github.com/users/dweinbeck/repos?per_page=100&sort=pushed&direction=desc";

/**
 * Internal helper to fetch a single GitHub repo
 */
async function fetchGitHubRepo(
  owner: string,
  repo: string
): Promise<GitHubRepoResponse | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 3600 }, // 1 hour ISR
  });
  if (!res.ok) {
    console.error(`GitHub API error for ${owner}/${repo}: ${res.status}`);
    return null;
  }
  return res.json();
}

/**
 * Fetch README content for a repository
 * Returns raw markdown string or null if unavailable
 */
export async function fetchReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/readme`,
    {
      headers: { Accept: "application/vnd.github.raw+json" },
      next: { revalidate: 3600 }, // 1 hour ISR
    }
  );
  if (!res.ok) return null;
  return res.text();
}

/**
 * Enrich a single project config with GitHub API data
 */
async function enrichProject(
  config: ProjectConfig
): Promise<EnrichedProject> {
  // If no repo, return curated-only data with private visibility
  if (!config.repo) {
    return {
      ...config,
      language: null,
      stars: 0,
      url: null,
      homepage: null,
      topics: [],
      createdAt: null,
      pushedAt: null,
      visibility: "private",
    };
  }

  // Parse owner/repo from config
  const [owner, repo] = config.repo.split("/");
  const githubData = await fetchGitHubRepo(owner, repo);

  // If GitHub API fails, return curated-only data
  if (!githubData) {
    return {
      ...config,
      language: null,
      stars: 0,
      url: null,
      homepage: null,
      topics: [],
      createdAt: null,
      pushedAt: null,
      visibility: "private",
    };
  }

  // Merge curated config with GitHub data
  return {
    ...config,
    language: githubData.language,
    stars: githubData.stargazers_count,
    url: githubData.html_url,
    homepage: githubData.homepage?.trim() || null,
    topics: githubData.topics ?? [],
    createdAt: githubData.created_at,
    pushedAt: githubData.pushed_at,
    visibility: githubData.private ? "private" : "public",
  };
}

/**
 * Fetch all projects with curated config merged with GitHub API data
 * Returns EnrichedProject[] with ISR caching
 */
export async function fetchAllProjects(): Promise<EnrichedProject[]> {
  const configs = projectConfig as ProjectConfig[];
  const enrichedProjects = await Promise.all(configs.map(enrichProject));
  return enrichedProjects;
}

/**
 * Fetch a single project by slug
 * Returns EnrichedProject or null if not found
 */
export async function fetchProjectBySlug(
  slug: string
): Promise<EnrichedProject | null> {
  const configs = projectConfig as ProjectConfig[];
  const config = configs.find((p) => p.slug === slug);

  if (!config) return null;

  return enrichProject(config);
}

/**
 * Legacy function: Fetch all GitHub repos for the user
 * Kept for backwards compatibility
 */
export async function fetchGitHubProjects(): Promise<Project[]> {
  const res = await fetch(GITHUB_API_URL, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status}`);
    return [];
  }

  const repos: GitHubRepo[] = await res.json();

  return repos
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      name: repo.name,
      description: repo.description ?? "No description provided",
      homepage: repo.homepage?.trim() || null,
      language: repo.language,
      stars: repo.stargazers_count,
      topics: repo.topics ?? [],
      url: repo.html_url,
    }));
}
