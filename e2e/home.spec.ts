import { test, expect } from "@playwright/test";

test("homepage has Sites heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sites" })).toBeVisible();
});
