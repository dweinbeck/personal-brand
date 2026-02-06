// Curated config from projects.json
export interface ProjectConfig {
  slug: string; // URL slug (e.g., "personal-brand")
  repo: string | null; // GitHub "owner/repo" or null for private
  featured: boolean; // Show on homepage
  status: "Live" | "In Development" | "Planning";
  name: string; // Display name
  description: string; // Custom description
  tags: string[]; // Tech tags for filtering
}

// Enriched with GitHub API data
export interface EnrichedProject extends ProjectConfig {
  // From GitHub API (null if private/unavailable)
  language: string | null;
  stars: number;
  url: string | null; // GitHub URL
  homepage: string | null; // Live site URL
  topics: string[]; // GitHub topics
  createdAt: string | null; // ISO date
  pushedAt: string | null; // ISO date (last commit)
  visibility: "public" | "private";
}

// Keep existing Project interface for backwards compatibility
export interface Project {
  name: string;
  description: string;
  language: string | null;
  stars: number;
  url: string;
  homepage: string | null;
  topics: string[];
}
