import namer from "color-namer";

/**
 * Returns the closest human-readable color name for a hex value.
 * Uses the "basic" list (147 recognizable names like Red, Blue, Green)
 * with Delta-E perceptual distance for accuracy.
 */
export function getColorName(hex: string): string {
  try {
    const result = namer(hex, { pick: ["basic"] });
    return result.basic[0]?.name ?? "Unknown";
  } catch {
    return "Unknown";
  }
}
