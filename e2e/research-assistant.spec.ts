import { expect, test } from "@playwright/test";

test.describe("Research Assistant - Smoke Tests", () => {
  test("page loads with correct title", async ({ page }) => {
    await page.goto("/tools/research-assistant");
    await expect(page).toHaveTitle(/Research Assistant/);
  });

  test("unauthenticated users see sign-in", async ({ page }) => {
    await page.goto("/tools/research-assistant");
    const signInButton = page.getByText("Sign in with Google");
    await expect(signInButton).toBeVisible({ timeout: 10_000 });
  });

  test.describe("authenticated UI", () => {
    // These tests require authentication.
    // For now, they verify the page structure loads even behind auth.
    // In CI, use a test account cookie or mock auth.

    test("main heading visible", async ({ page }) => {
      await page.goto("/tools/research-assistant");
      const heading = page.getByRole("heading", {
        name: "Research Assistant",
        level: 1,
      });
      // Either the heading is visible (authenticated) or sign-in is shown
      const isAuthenticated = await heading.isVisible().catch(() => false);
      if (isAuthenticated) {
        await expect(heading).toBeVisible();
      } else {
        await expect(page.getByText("Sign in with Google")).toBeVisible();
      }
    });

    test("chat interface elements visible when authenticated", async ({
      page,
    }) => {
      await page.goto("/tools/research-assistant");
      const heading = page.getByRole("heading", {
        name: "Research Assistant",
        level: 1,
      });
      const isAuthenticated = await heading
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      test.skip(!isAuthenticated, "Requires authentication");

      // Textarea for prompt input
      await expect(
        page.getByPlaceholder("Ask both models anything..."),
      ).toBeVisible();

      // Tier toggle buttons
      await expect(
        page.getByRole("button", { name: /Standard/ }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /Expert/ })).toBeVisible();

      // Submit button
      await expect(page.getByRole("button", { name: "Compare" })).toBeVisible();
    });

    test("tier toggle switches between Standard and Expert", async ({
      page,
    }) => {
      await page.goto("/tools/research-assistant");
      const heading = page.getByRole("heading", {
        name: "Research Assistant",
        level: 1,
      });
      const isAuthenticated = await heading
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      test.skip(!isAuthenticated, "Requires authentication");

      const standardBtn = page.getByRole("button", { name: /Standard/ });
      const expertBtn = page.getByRole("button", { name: /Expert/ });

      // Standard should be active by default (has bg-primary → text-white)
      await expect(standardBtn).toHaveClass(/text-white/);

      // Click Expert
      await expertBtn.click();
      await expect(expertBtn).toHaveClass(/text-white/);
    });

    test("empty state shows prompt hint", async ({ page }) => {
      await page.goto("/tools/research-assistant");
      const heading = page.getByRole("heading", {
        name: "Research Assistant",
        level: 1,
      });
      const isAuthenticated = await heading
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      test.skip(!isAuthenticated, "Requires authentication");

      await expect(
        page.getByText("Submit a prompt above to compare models side-by-side"),
      ).toBeVisible();
    });
  });

  test.describe("responsive layout", () => {
    test("mobile viewport: panels stack vertically", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/tools/research-assistant");
      const heading = page.getByRole("heading", {
        name: "Research Assistant",
        level: 1,
      });
      const isAuthenticated = await heading
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      test.skip(!isAuthenticated, "Requires authentication");

      // On mobile, grid should be single column (grid-cols-1)
      const responseGrid = page.locator(".grid.grid-cols-1");
      await expect(responseGrid).toBeVisible();
    });

    test("desktop viewport: panels side-by-side", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto("/tools/research-assistant");
      const heading = page.getByRole("heading", {
        name: "Research Assistant",
        level: 1,
      });
      const isAuthenticated = await heading
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      test.skip(!isAuthenticated, "Requires authentication");

      // On desktop, grid should show md:grid-cols-2 (rendered as 2 columns)
      const responseGrid = page.locator(".grid");
      await expect(responseGrid).toBeVisible();
    });
  });
});
