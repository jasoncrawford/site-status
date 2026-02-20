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
  await expect(page.getByRole("button", { name: "Add site" })).toBeVisible();
});

test("adds a new site", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add site" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Name").fill("New Test Site");
  await dialog.getByLabel("URL").fill("https://example.com/test");
  await dialog.getByRole("button", { name: "Add" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("New Test Site")).toBeVisible();
  await expect(page.getByText("https://example.com/test")).toBeVisible();
});

test("cancels adding a site", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add site" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Add site" })).toBeVisible();
});

test("dismisses dialog with Escape key", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add site" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("edits a site name", async ({ page }) => {
  await page.goto("/");

  // Hover the site card to reveal the edit button, click it
  const siteCard = page.locator(".group").filter({ hasText: "E2E Test Site" });
  await siteCard.hover();
  await siteCard.getByTitle("Edit site").click({ force: true });

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const nameInput = dialog.getByLabel("Name");
  await nameInput.clear();
  await nameInput.fill("Renamed Site");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Renamed Site")).toBeVisible();
});

test("site detail Edit button opens edit dialog", async ({ page, testData }) => {
  await page.goto(`/sites/${testData.siteId}`);
  await page.getByRole("button", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Name")).toBeVisible();
  await expect(dialog.getByLabel("URL")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
});

test("deletes a site with confirmation", async ({ page, adminClient }) => {
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

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Click Delete — should show confirmation
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog.getByText("Delete?")).toBeVisible();

  // Confirm deletion
  await dialog.getByRole("button", { name: "Yes" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Site To Delete")).not.toBeVisible();
});
