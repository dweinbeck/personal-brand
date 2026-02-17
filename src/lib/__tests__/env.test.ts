import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clientEnvSchema,
  detectSelfReferenceUrls,
  serverEnvSchema,
} from "../env";

// ── Helpers ─────────────────────────────────────────────────────

/** Minimal valid client env for tests. */
function validClientEnv() {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyBreal-key-value-here",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "personal-brand-486314.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "personal-brand-486314",
  };
}

/** Minimal valid server env for tests. */
function validServerEnv() {
  return {
    FIREBASE_PROJECT_ID: "personal-brand-486314",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "personal-brand-486314",
    CHATBOT_API_URL: "https://chatbot.example.com",
    BRAND_SCRAPER_API_URL: "https://scraper.example.com",
  };
}

// ── Client env schema ───────────────────────────────────────────

describe("clientEnvSchema", () => {
  it("accepts valid client env", () => {
    const result = clientEnvSchema.safeParse(validClientEnv());
    expect(result.success).toBe(true);
  });

  it("accepts optional NEXT_PUBLIC_TASKS_APP_URL", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv(),
      NEXT_PUBLIC_TASKS_APP_URL: "https://tasks.dan-weinbeck.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing NEXT_PUBLIC_FIREBASE_API_KEY", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv(),
      NEXT_PUBLIC_FIREBASE_API_KEY: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv(),
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing NEXT_PUBLIC_FIREBASE_PROJECT_ID", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv(),
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid NEXT_PUBLIC_TASKS_APP_URL", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv(),
      NEXT_PUBLIC_TASKS_APP_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

// ── Placeholder detection ───────────────────────────────────────

describe("placeholder detection", () => {
  const placeholderValues = [
    "your-api-key",
    "your_api_key",
    "sk-your-openai-api-key",
    "ghp_your_token_here",
    "whsec_your_secret",
    "placeholder-value",
    "xxx-not-real",
    "CHANGE-ME",
    "CHANGE_ME",
    "TODO-set-this",
    "INSERT-YOUR-KEY",
    "YOUR_OPENAI_KEY",
    "YOUR-API-KEY-HERE",
  ];

  for (const placeholder of placeholderValues) {
    it(`rejects placeholder: "${placeholder}"`, () => {
      const result = clientEnvSchema.safeParse({
        ...validClientEnv(),
        NEXT_PUBLIC_FIREBASE_API_KEY: placeholder,
      });
      expect(result.success).toBe(false);
    });
  }

  it("accepts real-looking values", () => {
    const result = clientEnvSchema.safeParse({
      ...validClientEnv(),
      NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyB1234567890abcdefg",
    });
    expect(result.success).toBe(true);
  });
});

// ── Server env schema ───────────────────────────────────────────

describe("serverEnvSchema", () => {
  it("accepts minimal valid server env", () => {
    const result = serverEnvSchema.safeParse(validServerEnv());
    expect(result.success).toBe(true);
  });

  it("accepts full server env with all optional fields", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      FIREBASE_CLIENT_EMAIL:
        "firebase-adminsdk@project.iam.gserviceaccount.com",
      FIREBASE_PRIVATE_KEY:
        "-----BEGIN PRIVATE KEY-----\nreal-key\n-----END PRIVATE KEY-----",
      CHATBOT_API_KEY: "real-chatbot-key-abc123",
      GITHUB_TOKEN: "ghp_abcdef1234567890abcdef1234567890abcd",
      TODOIST_API_TOKEN: "abc123def456",
      STRIPE_SECRET_KEY: "sk_test_abc123",
      STRIPE_WEBHOOK_SECRET: "whsec_abc123",
      OPENAI_API_KEY: "sk-proj-abc123",
      GOOGLE_GENERATIVE_AI_API_KEY: "AIzaSyBrealkey123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing CHATBOT_API_URL", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      CHATBOT_API_URL: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing BRAND_SCRAPER_API_URL", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      BRAND_SCRAPER_API_URL: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid FIREBASE_CLIENT_EMAIL", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      FIREBASE_CLIENT_EMAIL: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

// ── Secret format validation ────────────────────────────────────

describe("secret format validation", () => {
  it("rejects GITHUB_TOKEN without ghp_ or github_pat_ prefix", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      GITHUB_TOKEN: "gho_wrongprefix123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts GITHUB_TOKEN with github_pat_ prefix", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      GITHUB_TOKEN: "github_pat_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects STRIPE_SECRET_KEY without sk_test_ or sk_live_ prefix", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      STRIPE_SECRET_KEY: "pk_test_wrong",
    });
    expect(result.success).toBe(false);
  });

  it("rejects STRIPE_WEBHOOK_SECRET without whsec_ prefix", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      STRIPE_WEBHOOK_SECRET: "wrong_prefix_abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects OPENAI_API_KEY without sk- prefix", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      OPENAI_API_KEY: "oai-wrong-prefix",
    });
    expect(result.success).toBe(false);
  });
});

// ── Cross-field validation ──────────────────────────────────────

describe("cross-field validation", () => {
  it("rejects mismatched FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_PROJECT_ID", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      FIREBASE_PROJECT_ID: "project-a",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "project-b",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.includes("must equal"))).toBe(true);
    }
  });

  it("passes when both project IDs match", () => {
    const result = serverEnvSchema.safeParse({
      ...validServerEnv(),
      FIREBASE_PROJECT_ID: "same-project",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "same-project",
    });
    expect(result.success).toBe(true);
  });
});

// ── Self-reference URL detection ────────────────────────────────

describe("detectSelfReferenceUrls", () => {
  beforeEach(() => {
    vi.stubEnv("K_SERVICE", "personal-brand");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("warns when CHATBOT_API_URL contains the app's Cloud Run service name", () => {
    const warnings = detectSelfReferenceUrls({
      CHATBOT_API_URL:
        "https://personal-brand-pcyrow43pa-uc.a.run.app/api/chat",
      BRAND_SCRAPER_API_URL: "https://brand-scraper-abc-uc.a.run.app",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("CHATBOT_API_URL");
  });

  it("warns when BRAND_SCRAPER_API_URL contains dan-weinbeck.com", () => {
    const warnings = detectSelfReferenceUrls({
      CHATBOT_API_URL: "https://chatbot-service-abc-uc.a.run.app",
      BRAND_SCRAPER_API_URL: "https://dan-weinbeck.com/api/scrape",
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("BRAND_SCRAPER_API_URL");
  });

  it("returns no warnings for correct external URLs", () => {
    const warnings = detectSelfReferenceUrls({
      CHATBOT_API_URL: "https://chatbot-service-abc-uc.a.run.app",
      BRAND_SCRAPER_API_URL: "https://brand-scraper-xyz-uc.a.run.app",
    });
    expect(warnings).toHaveLength(0);
  });

  it("returns no warnings when K_SERVICE is not set (local dev)", () => {
    vi.stubEnv("K_SERVICE", "");
    const warnings = detectSelfReferenceUrls({
      CHATBOT_API_URL: "https://personal-brand-pcyrow43pa-uc.a.run.app",
      BRAND_SCRAPER_API_URL: "https://dan-weinbeck.com/api/scrape",
    });
    expect(warnings).toHaveLength(0);
  });
});
