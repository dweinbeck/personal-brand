import { serverEnv } from "@/lib/env";
import {
  type FastApiResponse,
  fastApiResponseSchema,
} from "@/lib/schemas/fastapi";

export class FastApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public isTimeout: boolean = false,
  ) {
    super(message);
    this.name = "FastApiError";
  }
}

export async function askFastApi(question: string): Promise<FastApiResponse> {
  const env = serverEnv();
  const chatbotUrl = env.CHATBOT_API_URL;
  const chatbotKey = env.CHATBOT_API_KEY;

  let res: Response;
  try {
    res = await fetch(`${chatbotUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(chatbotKey && { "X-API-Key": chatbotKey }),
      },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    throw new FastApiError(
      isTimeout ? "Request timed out" : "Network error",
      503,
      isTimeout,
    );
  }

  if (!res.ok) {
    let detail = `FastAPI returned ${res.status}`;
    try {
      const errBody = await res.json();
      if (typeof errBody?.detail === "string") detail = errBody.detail;
      else if (typeof errBody?.error === "string") detail = errBody.error;
      else if (typeof errBody?.message === "string") detail = errBody.message;
    } catch {
      // Response body is not JSON
    }
    throw new FastApiError(detail, res.status);
  }

  const raw = await res.json();
  const parsed = fastApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new FastApiError("Invalid response shape from FastAPI", 502);
  }

  return parsed.data;
}
