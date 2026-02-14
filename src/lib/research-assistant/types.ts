// ── Research Assistant Types ─────────────────────────────────────
// Pure type definitions — no runtime code. Every other research-assistant
// module imports from here.

import type { Timestamp } from "firebase-admin/firestore";

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
  | "error"
  | "heartbeat";

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

export type StreamStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "complete"
  | "error";

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

// ── Conversation types (Phase 3) ────────────────────────────────

export type MessageRole =
  | "user"
  | "gemini"
  | "openai"
  | "gemini-reconsider"
  | "openai-reconsider";

export type ConversationDoc = {
  userId: string;
  tier: ResearchTier;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  totalCreditsSpent: number;
  status: "active" | "archived";
};

export type MessageDoc = {
  role: MessageRole;
  content: string;
  createdAt: Timestamp;
  turnNumber: number;
  action: BillingAction;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  creditsCharged?: number;
};

export type ConversationSummary = {
  id: string;
  title: string;
  tier: ResearchTier;
  messageCount: number;
  totalCreditsSpent: number;
  updatedAt: string;
};
