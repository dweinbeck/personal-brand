// ── Structured JSON Logger for Cloud Run ────────────────────────
// Writes structured JSON to stdout. Cloud Logging auto-parses
// severity, message, and trace fields when running on Cloud Run.
//
// IMPORTANT: Never log prompt content or user email.
// Log only: userId, tier, promptLength, latency, token counts, error type/message.

type LogSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR";

interface StructuredLogFields {
  severity: LogSeverity;
  message: string;
  component: "research-assistant";
  [key: string]: unknown;
}

export function log(fields: StructuredLogFields): void {
  const entry = { ...fields, timestamp: new Date().toISOString() };
  console.log(JSON.stringify(entry));
}

/**
 * Creates a request-scoped logger with Cloud Trace correlation.
 *
 * When running on Cloud Run, the X-Cloud-Trace-Context header is
 * automatically set by the load balancer. Embedding the trace ID
 * in log entries lets Cloud Logging group all logs for a single
 * request together.
 */
export function createRequestLogger(request: Request) {
  const traceHeader = request.headers.get("X-Cloud-Trace-Context");
  const projectId = process.env.FIREBASE_PROJECT_ID;

  const traceFields: Record<string, string> = {};
  if (traceHeader && projectId) {
    const [trace] = traceHeader.split("/");
    traceFields["logging.googleapis.com/trace"] =
      `projects/${projectId}/traces/${trace}`;
  }

  return {
    info: (message: string, extra?: Record<string, unknown>) =>
      log({
        severity: "INFO",
        message,
        component: "research-assistant",
        ...traceFields,
        ...extra,
      }),
    warn: (message: string, extra?: Record<string, unknown>) =>
      log({
        severity: "WARNING",
        message,
        component: "research-assistant",
        ...traceFields,
        ...extra,
      }),
    error: (message: string, extra?: Record<string, unknown>) =>
      log({
        severity: "ERROR",
        message,
        component: "research-assistant",
        ...traceFields,
        ...extra,
      }),
  };
}
