export interface AppListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
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
    },
    {
      slug: "tasks",
      title: "Tasks",
      tag: "Productivity",
      subtitle: "Organize projects, tasks, and tags",
      description:
        "Full-featured task management with workspaces, projects, sections, tags, subtasks, effort scoring, and board views. Built with a standalone PostgreSQL backend.",
      href: "/apps/tasks",
    },
  ];
}
