import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "https://dev.dan-weinbeck.com",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
