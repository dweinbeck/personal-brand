export interface AppListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
  launchedAt: string;
  updatedAt: string;
  techStack: string[];
  available: boolean;
}

export function getApps(): AppListing[] {
  return [
    {
      slug: "brand-scraper",
      title: "Brand Scraper",
      tag: "Branding",
      subtitle: "Extract brand identity from any website",
      description:
        "Submit a URL and get back colors, fonts, logos, and assets with AI-powered confidence scoring. Uses Playwright for deep page extraction.",
      href: "/apps/brand-scraper",
      launchedAt: "2026-02-09",
      updatedAt: "2026-02-10",
      techStack: ["Playwright", "Fastify", "GCS", "Gemini"],
      available: true,
    },
    {
      slug: "envelopes",
      title: "Dave Ramsey Digital Envelopes",
      tag: "Finance",
      subtitle: "Zero-based budgeting with digital envelopes",
      description:
        "Manage your monthly budget using the Dave Ramsey envelope method. Allocate income to categories and track spending in real time.",
      href: "/envelopes",
      launchedAt: "2026-02-10",
      updatedAt: "2026-02-10",
      techStack: ["React", "Firebase", "Tailwind"],
      available: true,
    },
    {
      slug: "tasks",
      title: "Task Manager",
      tag: "Productivity",
      subtitle: "Organize projects, tasks, and tags",
      description:
        "Full-featured task management with workspaces, projects, sections, tags, subtasks, effort scoring, and board views. Built with a standalone PostgreSQL backend.",
      href: process.env.TASKS_APP_URL || "https://todoist-app.run.app",
      launchedAt: "2026-02-12",
      updatedAt: "2026-02-12",
      techStack: ["Next.js", "PostgreSQL", "Prisma", "Firebase Auth"],
      available: true,
    },
  ];
}
