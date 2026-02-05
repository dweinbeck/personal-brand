import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FilterResult } from "./filters";

type ApprovedResponses = Record<string, string>;

let cachedResponses: ApprovedResponses | null = null;

function loadResponses(): ApprovedResponses {
  if (cachedResponses) return cachedResponses;
  const raw = readFileSync(
    join(process.cwd(), "src/data/approved-responses.json"),
    "utf-8",
  );
  cachedResponses = JSON.parse(raw);
  return cachedResponses!;
}

export function getRefusalMessage(filterResult: FilterResult): string {
  const responses = loadResponses();

  if (filterResult.reason === "injection") {
    return responses.prompt_injection;
  }

  if (filterResult.reason === "sensitive") {
    const topic = filterResult.topic?.toLowerCase() ?? "";

    if (topic.includes("salary") || topic.includes("compensation")) {
      return responses.salary_compensation;
    }
    if (topic.includes("political") || topic.includes("religious")) {
      return responses.political_religious;
    }
    if (topic.includes("private")) {
      return responses.personal_private;
    }

    return responses.personal_private;
  }

  return responses.off_topic;
}
