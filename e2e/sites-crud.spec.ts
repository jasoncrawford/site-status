import { test, expect } from "./fixtures";

test.afterEach(async ({ adminClient }) => {
  // Restore renamed site if needed
  const { data: sites } = await adminClient.from("sites").select("id, name");
  const renamed = sites?.find((s) => s.name === "Renamed Site");
  if (renamed) {
    await adminClient
      .from("sites")
      .update({ name: "E2E Test Site" })
      .eq("id", renamed.id);
  }

  // Clean up any extra sites created during tests (keep the seeded one)
  for (const site of sites ?? []) {
    if (site.name !== "E2E Test Site" && site.name !== "Renamed Site") {
      await adminClient.from("incidents").delete().eq("site_id", site.id);
      await adminClient.from("checks").delete().eq("site_id", site.id);
      await adminClient.from("sites").delete().eq("id", site.id);
    }
  }
});

test("shows Add site card when authenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Add site")).toBeVisible();
});

test("adds a new site", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add site").click();

  await page.getByPlaceholder("Site name").fill("New Test Site");
  await page.getByPlaceholder("https://example.com").fill("https://example.com/test");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("New Test Site")).toBeVisible();
  await expect(page.getByText("https://example.com/test")).toBeVisible();
});

test("cancels adding a site", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add site").click();

  await expect(page.getByPlaceholder("Site name")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByPlaceholder("Site name")).not.toBeVisible();
  await expect(page.getByText("Add site")).toBeVisible();
});

test("edits a site name", async ({ page }) => {
  await page.goto("/");

  // Hover the site card to reveal the edit button
  const siteCard = page.locator(".group").filter({ hasText: "E2E Test Site" });
  await siteCard.hover();
  await siteCard.getByTitle("Edit site").click({ force: true });

  // Clear and fill the name field
  const nameInput = page.locator('input[name="name"]');
  await nameInput.clear();
  await nameInput.fill("Renamed Site");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Renamed Site")).toBeVisible();
});

test("site detail Edit button opens edit form", async ({ page, testData }) => {
  await page.goto(`/sites/${testData.siteId}`);
  await page.getByTitle("Edit site").click();

  // Should show the inline edit form with name and URL fields
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="url"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
});

test("deletes a site", async ({ page, adminClient }) => {
  // First create a site to delete
  await adminClient
    .from("sites")
    .insert({ name: "Site To Delete", url: "https://example.com/delete" });

  await page.goto("/");
  await expect(page.getByText("Site To Delete")).toBeVisible();

  // Hover and click edit
  const siteCard = page.locator(".group").filter({ hasText: "Site To Delete" });
  await siteCard.hover();
  await siteCard.getByTitle("Edit site").click({ force: true });

  // Click delete
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText("Site To Delete")).not.toBeVisible();
});
