export interface AppListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
  /** When true, external links open in the same tab instead of a new tab. */
  sameTab?: boolean;
  techStack: string[];
}

export function getApps(): AppListing[] {
  return [
    {
      slug: "brand-scraper",
      title: "Brands",
      tag: "Branding",
      subtitle: "Extract brand identity from any website",
      description:
        "Submit a URL and get back colors, fonts, logos, and assets with AI-powered confidence scoring. Uses Playwright for deep page extraction.",
      href: "/apps/brand-scraper",
      techStack: ["Next.js", "Firebase", "Playwright", "AI SDK"],
    },
    {
      slug: "tasks",
      title: "Tasks",
      tag: "Productivity",
      subtitle: "Organize projects, tasks, and tags",
      description:
        "Full-featured task management with workspaces, projects, sections, tags, subtasks, effort scoring, and board views. Built with a standalone PostgreSQL backend.",
      href:
        process.env.NEXT_PUBLIC_TASKS_APP_URL ||
        "https://tasks.dev.dan-weinbeck.com",
      sameTab: true,
      techStack: ["Next.js", "PostgreSQL", "Tailwind CSS"],
    },
    {
      slug: "envelopes",
      title: "Envelopes",
      tag: "Finance",
      subtitle: "Zero-based budgeting with digital envelopes",
      description:
        "Manage your monthly budget using the envelope budgeting method. Allocate income to categories and track spending in real time.",
      href: "/envelopes",
      techStack: ["Next.js", "Firebase", "Tailwind CSS"],
    },
    {
      slug: "research",
      title: "Research",
      tag: "AI",
      subtitle: "Compare AI models side-by-side in real time",
      description:
        "Send a prompt to two AI models simultaneously and see their responses stream side-by-side. Choose between Standard and Expert tiers for different model combinations.",
      href: "/tools/research-assistant",
      techStack: ["Next.js", "Vercel AI SDK", "Streaming"],
    },
  ];
}
