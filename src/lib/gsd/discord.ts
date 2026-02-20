const EMBED_COLORS = {
  routed: 0x22c55e, // green
  failed: 0xef4444, // red
  pending: 0xeab308, // yellow
};

interface DiscordAlertOptions {
  title: string;
  status: "routed" | "failed" | "pending";
  fields: { name: string; value: string; inline?: boolean }[];
}

/**
 * Send a Discord webhook alert with an embed.
 * Fire-and-forget — never throws, never blocks capture processing.
 * Handles 429 rate limits with a single retry after the retry-after delay.
 */
export async function sendDiscordAlert(
  options: DiscordAlertOptions,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return; // Silently skip if not configured

  const payload = {
    embeds: [
      {
        title: options.title.slice(0, 256),
        color: EMBED_COLORS[options.status] ?? 0x6b7280,
        fields: options.fields.map((f) => ({
          name: f.name.slice(0, 256),
          value: f.value.slice(0, 1024),
          inline: f.inline ?? true,
        })),
        timestamp: new Date().toISOString(),
        footer: { text: "GSD Builder OS" },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Handle rate limit with single retry
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "2");
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // Silently ignore — Discord is supplementary
  }
}

/**
 * Send a capture routed alert.
 */
export function alertCaptureRouted(capture: {
  type: string;
  destination: string;
  title: string;
  confidence: number;
}): void {
  sendDiscordAlert({
    title: `Capture Routed: ${capture.title}`,
    status: "routed",
    fields: [
      { name: "Type", value: capture.type },
      { name: "Destination", value: capture.destination },
      {
        name: "Confidence",
        value: `${(capture.confidence * 100).toFixed(0)}%`,
      },
    ],
  }).catch(() => {});
}

/**
 * Send a capture failed alert.
 */
export function alertCaptureFailed(capture: {
  type: string;
  error: string;
  captureId: string;
}): void {
  sendDiscordAlert({
    title: "Capture Failed",
    status: "failed",
    fields: [
      { name: "Type", value: capture.type },
      { name: "Error", value: capture.error.slice(0, 500) },
      { name: "ID", value: capture.captureId.slice(0, 8) },
    ],
  }).catch(() => {});
}
