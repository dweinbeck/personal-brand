import type { Metadata } from "next";
import type { PlaceholderProject } from "@/components/home/FeaturedProjects";
import { ProjectCard } from "@/components/home/ProjectCard";

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source projects and experiments by Dan Weinbeck.",
};

const projects: PlaceholderProject[] = [
  {
    name: "Dave Ramsey Digital Envelope App",
    description:
      "Budget management app implementing the envelope method. Allocate, track, and manage spending across categories.",
    tags: ["React Native", "Firebase", "Fintech"],
    status: "In Development",
  },
  {
    name: "Chicago Bus Text-Multiplier",
    description:
      "Stop relying on inaccurate bus arrival times and use the only source that's consistently accurate \u2014 texting the bus stop number \u2014 but with added functionality to accurately assess the quickest route to get somewhere.",
    tags: ["Twilio", "Python", "CTA API"],
    status: "Live",
  },
  {
    name: "60-Second Lesson",
    description:
      "Micro-learning app delivering bite-sized lessons in under a minute. Learn something new every day.",
    tags: ["Next.js", "AI", "Education"],
    status: "In Development",
  },
  {
    name: "Month-Grid Habit Tracker",
    description:
      "Minimalist habit tracker designed for iPhone lock screen widgets. One glance, full month overview.",
    tags: ["Swift", "WidgetKit", "iOS"],
    status: "Planning",
  },
  {
    name: "Research Assistant",
    description:
      "Get opinions from multiple LLMs at one time for things that matter.",
    tags: ["Multi-LLM", "Python", "AI"],
    status: "In Development",
  },
  {
    name: "PromptOS",
    description:
      "Intelligence layer to optimize outcomes between a user and an LLM.",
    tags: ["TypeScript", "AI", "DevTools"],
    status: "Planning",
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-text-primary">Projects</h1>
      <p className="mt-2 text-text-secondary">
        Side projects and explorations across AI, data, and product.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </div>
  );
}
