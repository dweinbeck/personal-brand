/**
 * Analytics event stubs.
 *
 * Replace the console.log implementation with a real analytics provider
 * (e.g. PostHog, Plausible, GA4) when event volume justifies it.
 */
export function trackEvent(
  event: string,
  data?: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console
  console.log("[Analytics]", event, data);
}
