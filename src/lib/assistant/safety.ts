import { sanitizeInput, detectBlockedContent } from "./filters";
import { getRefusalMessage } from "./refusals";

export type SafetyCheckResult = {
  safe: boolean;
  sanitizedInput: string;
  refusalMessage: string | null;
};

export function runSafetyPipeline(userMessage: string): SafetyCheckResult {
  // Step 1: Sanitize input
  const sanitized = sanitizeInput(userMessage);

  // Step 2: Check for blocked content
  const filterResult = detectBlockedContent(sanitized);

  if (filterResult.blocked) {
    return {
      safe: false,
      sanitizedInput: sanitized,
      refusalMessage: getRefusalMessage(filterResult),
    };
  }

  return {
    safe: true,
    sanitizedInput: sanitized,
    refusalMessage: null,
  };
}
