import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("shows Sites heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sites" })).toBeVisible();
});

test("shows seeded site card with name and URL", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("E2E Test Site")).toBeVisible();
  await expect(page.getByText("https://httpbin.org/status/200")).toBeVisible();
});

test("does not show Add site button for unauthenticated user", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Add site")).not.toBeVisible();
});

test("navigates to site detail on card click", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /E2E Test Site/ }).click();
  await page.waitForURL(/\/sites\//, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "E2E Test Site" })).toBeVisible();
});

test("site detail shows expected sections", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /E2E Test Site/ }).click();

  await expect(page.getByText("No incidents recorded.")).toBeVisible();
  await expect(page.getByText("No checks recorded yet.")).toBeVisible();
  await expect(page.getByText("← All Sites")).toBeVisible();
});
