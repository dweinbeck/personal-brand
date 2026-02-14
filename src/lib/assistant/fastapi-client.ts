import {
  type FastApiResponse,
  fastApiResponseSchema,
} from "@/lib/schemas/fastapi";

const CHATBOT_API_URL = process.env.CHATBOT_API_URL;
const CHATBOT_API_KEY = process.env.CHATBOT_API_KEY;

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
  if (!CHATBOT_API_URL) {
    throw new FastApiError("CHATBOT_API_URL not configured", 503);
  }

  let res: Response;
  try {
    res = await fetch(`${CHATBOT_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(CHATBOT_API_KEY && { "X-API-Key": CHATBOT_API_KEY }),
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
    throw new FastApiError(`FastAPI returned ${res.status}`, res.status);
  }

  const raw = await res.json();
  const parsed = fastApiResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new FastApiError("Invalid response shape from FastAPI", 502);
  }

  return parsed.data;
}
