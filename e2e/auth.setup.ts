import { test as setup, expect } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("e2e-test@example.com");
  await page.locator('input[type="password"]').fill("test-password-123");
  await page.getByRole("button", { name: "Log in" }).click();

  // Wait for redirect to home page
  await page.waitForURL("/");
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

  // Save auth state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
