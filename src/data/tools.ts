export interface ToolListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
  external: boolean;
  type: "custom-gpt" | "app";
}

export function getToolButtonLabel(tool: ToolListing): string {
  if (tool.type === "custom-gpt") return "Open Custom GPT";
  if (tool.type === "app") return "Open App";
  return "Open Tool";
}

export function getTools(): ToolListing[] {
  return [
    {
      slug: "new-phase-planner",
      title: "New Phase Planner",
      tag: "Planning",
      subtitle: "Plan product phases with structured AI guidance",
      description:
        "When you have an idea for more than a trivial set of updates to your product, use this GPT to break it into actionable phases.",
      href: "https://chatgpt.com/g/g-69895e8109a881919e4012452f0a7cd8-new-phase-planner",
      external: true,
      type: "custom-gpt",
    },
    {
      slug: "frd-interviewer",
      title: "FRD Interviewer",
      tag: "Requirements",
      subtitle: "Generate requirements through guided conversation",
      description:
        "This GPT asks you questions until it has enough information to create a simple but comprehensive functional requirements document.",
      href: "https://chatgpt.com/g/g-6987d85cd11081918ff321e9dc927966-frd-interviewer",
      external: true,
      type: "custom-gpt",
    },
    {
      slug: "frd-generator",
      title: "FRD Generator",
      tag: "Requirements",
      subtitle: "Create functional requirements documents from specs",
      description:
        "Provide your project specifications and get a structured FRD document with user stories, acceptance criteria, and technical requirements.",
      href: "https://dev.dan-weinbeck.com/tools/frd-generator",
      external: true,
      type: "app",
    },
  ];
}
