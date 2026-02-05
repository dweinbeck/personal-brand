import { Button } from "@/components/ui/Button";
import { ProjectCard } from "./ProjectCard";

export interface PlaceholderProject {
  name: string;
  description: string;
  tags: string[];
  status: "Live" | "In Development" | "Planning";
}

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

export function FeaturedProjects() {
  return (
    <section className="py-8 motion-safe:animate-fade-in-up">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary text-center mb-10">
        Featured Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button variant="secondary" size="sm" href="/projects">
          See all projects →
        </Button>
      </div>
    </section>
  );
}
