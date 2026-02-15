export interface ToolListing {
  slug: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  href: string;
  external: boolean;
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
    },
    {
      slug: "frd-generator",
      title: "FRD Generator",
      tag: "Requirements",
      subtitle: "Create functional requirements documents from specs",
      description:
        "Provide your project specifications and get a structured FRD document with user stories, acceptance criteria, and technical requirements.",
      href: "https://chatgpt.com/g/g-frd-generator",
      external: true,
    },
    {
      slug: "research-assistant",
      title: "Research Assistant",
      tag: "AI",
      subtitle: "Compare AI models side-by-side in real time",
      description:
        "Send a prompt to two AI models simultaneously and see their responses stream side-by-side. Choose between Standard and Expert tiers for different model combinations.",
      href: "/tools/research-assistant",
      external: false,
    },
    {
      slug: "digital-envelopes",
      title: "Digital Envelopes",
      tag: "Finance",
      subtitle: "Zero-based budgeting with digital envelopes",
      description:
        "Manage your monthly budget using the envelope budgeting method. Allocate income to categories and track spending in real time.",
      href: "/envelopes",
      external: false,
    },
  ];
}
