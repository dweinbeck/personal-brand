// ── Research Assistant Types ─────────────────────────────────────
// Pure type definitions — no runtime code. Every other research-assistant
// module imports from here.

// ── Tier types ──────────────────────────────────────────────────

export type ResearchTier = "standard" | "expert";

// ── Model config types ──────────────────────────────────────────

export type ModelProvider = "openai" | "google";

export type ModelConfig = {
  provider: ModelProvider;
  modelId: string;
  displayName: string;
};

export type TierConfig = {
  tier: ResearchTier;
  models: [ModelConfig, ModelConfig];
  creditCost: number;
};

// ── SSE event types (server ↔ client contract) ──────────────────

export type SSEEventType =
  | "gemini"
  | "openai"
  | "gemini-done"
  | "openai-done"
  | "gemini-error"
  | "openai-error"
  | "complete"
  | "error";

export type StreamTextEvent = {
  text: string;
};

export type StreamDoneEvent = {
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export type StreamErrorEvent = {
  message: string;
};

export type StreamCompleteEvent = Record<string, never>;

export type SSEEventData =
  | StreamTextEvent
  | StreamDoneEvent
  | StreamErrorEvent
  | StreamCompleteEvent;

// ── API request/response types ──────────────────────────────────

export type ChatRequest = {
  prompt: string;
  tier: ResearchTier;
};

export type ChatErrorResponse = {
  error: string;
  code?: string;
};

// ── Billing types ───────────────────────────────────────────────

export type BillingAction = "prompt" | "reconsider" | "follow-up";

export type BillingTransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export type BillingTransaction = {
  userId: string;
  amount: number;
  tool: string;
  action: BillingAction;
  tier: ResearchTier;
  status: BillingTransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
  completedAt?: Date;
};

// ── Stream state types (for client hook) ────────────────────────

export type StreamStatus = "idle" | "streaming" | "complete" | "error";

export type ModelResponse = {
  text: string;
  status: StreamStatus;
  error?: string;
  usage?: StreamDoneEvent["usage"];
};

export type ResearchChatState = {
  gemini: ModelResponse;
  openai: ModelResponse;
  overallStatus: StreamStatus;
};
