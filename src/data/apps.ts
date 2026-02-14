export interface AppListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
  techStack: string[];
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
      techStack: ["Playwright", "Fastify", "GCS", "Gemini"],
    },
    {
      slug: "envelopes",
      title: "Dave Ramsey Digital Envelopes",
      tag: "Finance",
      subtitle: "Zero-based budgeting with digital envelopes",
      description:
        "Manage your monthly budget using the Dave Ramsey envelope method. Allocate income to categories and track spending in real time.",
      href: "/envelopes",
      techStack: ["React", "Firebase", "Tailwind"],
    },
    {
      slug: "tasks",
      title: "Task Manager",
      tag: "Productivity",
      subtitle: "Organize projects, tasks, and tags",
      description:
        "Full-featured task management with workspaces, projects, sections, tags, subtasks, effort scoring, and board views. Built with a standalone PostgreSQL backend.",
      href: process.env.TASKS_APP_URL || "https://tasks.dan-weinbeck.com",
      techStack: ["Next.js", "PostgreSQL", "Prisma", "Firebase Auth"],
    },
  ];
}
