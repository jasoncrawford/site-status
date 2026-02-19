import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("shows login form with email and password fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("shows error on invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("wrong@example.com");
  await page.locator('input[type="password"]').fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("logs in successfully and shows Settings and Log out", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("e2e-test@example.com");
  await page.locator('input[type="password"]').fill("test-password-123");
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL("/");
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("redirects unauthenticated user from /settings to /login", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("logout redirects to /login", async ({ page, browser }) => {
  // First log in
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill("e2e-test@example.com");
  await page.locator('input[type="password"]').fill("test-password-123");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");

  // Then log out (this invalidates ALL sessions via Supabase global signOut)
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/login/);
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

  // Re-authenticate and re-save storageState so subsequent tests still work
  const context = await browser.newContext();
  const freshPage = await context.newPage();
  await freshPage.goto("/login");
  await freshPage.getByPlaceholder("you@example.com").fill("e2e-test@example.com");
  await freshPage.locator('input[type="password"]').fill("test-password-123");
  await freshPage.getByRole("button", { name: "Log in" }).click();
  await freshPage.waitForURL("/");
  await context.storageState({ path: "e2e/.auth/user.json" });
  await context.close();
});
