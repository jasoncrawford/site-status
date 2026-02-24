import { test, expect } from "./fixtures";

test.afterEach(async ({ adminClient }) => {
  await adminClient.from("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
});

test("shows Contacts heading on settings page", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
});

test("shows empty state", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("No contacts added yet.")).toBeVisible();
});

test("adds an email contact", async ({ page }) => {
  await page.goto("/settings");
  await page.getByPlaceholder("email@example.com").fill("contact@example.com");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("contact@example.com")).toBeVisible();
});

test("adds a Slack contact", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("combobox").selectOption("slack");
  await page.getByPlaceholder("https://hooks.slack.com/services/...").fill("https://hooks.slack.com/services/T00/B00/test");
  await page.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText("Slack webhook")).toBeVisible();
});

test("removes a contact", async ({ page, adminClient }) => {
  // Seed a contact
  await adminClient.from("contacts").insert({ type: "email", email: "remove-me@example.com" });

  await page.goto("/settings");
  await expect(page.getByText("remove-me@example.com")).toBeVisible();

  // Click the Remove button next to the specific contact
  const contactRow = page.getByRole("listitem").filter({ hasText: "remove-me@example.com" });
  await contactRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("remove-me@example.com")).not.toBeVisible();
});
