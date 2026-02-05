const rateLimitMap = new Map<string, number[]>();

const MAX_REQUESTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkAssistantRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetMs: number;
} {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const oldestInWindow = recent[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + WINDOW_MS - now,
    };
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);

  return {
    allowed: true,
    remaining: MAX_REQUESTS - recent.length,
    resetMs: WINDOW_MS,
  };
}
