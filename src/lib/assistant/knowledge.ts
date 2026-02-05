import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "src/data");

let cachedKnowledge: string | null = null;

function loadJson(filename: string): string {
  return readFileSync(join(DATA_DIR, filename), "utf-8");
}

function loadMarkdown(filename: string): string {
  return readFileSync(join(DATA_DIR, filename), "utf-8");
}

export function getKnowledgeBase(): string {
  if (cachedKnowledge) return cachedKnowledge;

  const canon = JSON.parse(loadJson("canon.json"));
  const projects = JSON.parse(loadJson("projects.json"));
  const faq = JSON.parse(loadJson("faq.json"));
  const contact = JSON.parse(loadJson("contact.json"));
  const writing = JSON.parse(loadJson("writing.json"));
  const services = loadMarkdown("services.md");

  const sections: string[] = [
    `## About Dan\nName: ${canon.name}\nTitle: ${canon.title}\nLocation: ${canon.location}\nBio: ${canon.bio}\nSkills: ${canon.skills.join(", ")}`,

    `## Projects\n${projects.map((p: { name: string; description: string; status: string; tags: string[] }) => `- **${p.name}** (${p.status}): ${p.description} [Tags: ${p.tags.join(", ")}]`).join("\n")}`,

    `## FAQ\n${faq.map((q: { question: string; answer: string }) => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n")}`,

    `## Contact\nEmail: ${contact.email}\nLinkedIn: ${contact.linkedin}\nGitHub: ${contact.github}\nPreferred: ${contact.preferredMethod}\nResponse time: ${contact.responseTime}`,

    `## Services\n${services}`,

    `## Writing\n${writing.map((a: { title: string; topic: string; date: string }) => `- "${a.title}" (${a.topic}, ${a.date})`).join("\n")}`,
  ];

  cachedKnowledge = sections.join("\n\n");
  return cachedKnowledge;
}

export function clearKnowledgeCache(): void {
  cachedKnowledge = null;
}
