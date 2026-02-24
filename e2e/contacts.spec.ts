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

test("adds an email contact and displays it in the list", async ({ page }) => {
  await page.goto("/settings");
  await page.getByPlaceholder("email@example.com").fill("contact@example.com");
  await page.getByRole("button", { name: "Add" }).click();

  const contactRow = page.getByRole("listitem").filter({ hasText: "contact@example.com" });
  await expect(contactRow).toBeVisible();
  await expect(contactRow.getByText("email")).toBeVisible();
  await expect(contactRow.getByText("contact@example.com")).toBeVisible();
});

test("adds a Slack contact and displays it in the list", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("combobox").selectOption("slack");
  await page.getByPlaceholder("#channel name").fill("#alerts");
  await page.getByPlaceholder("https://hooks.slack.com/services/...").fill("https://hooks.slack.com/services/T00/B00/test");
  await page.getByRole("button", { name: "Add" }).click();

  const contactRow = page.getByRole("listitem").filter({ hasText: "#alerts" });
  await expect(contactRow).toBeVisible();
  await expect(contactRow.getByText("slack")).toBeVisible();
  await expect(contactRow.getByText("#alerts")).toBeVisible();
  await expect(contactRow.getByRole("button", { name: "Remove" })).toBeVisible();
});

test("removes an email contact", async ({ page, adminClient }) => {
  await adminClient.from("contacts").insert({ type: "email", email: "remove-me@example.com" });

  await page.goto("/settings");
  await expect(page.getByText("remove-me@example.com")).toBeVisible();

  const contactRow = page.getByRole("listitem").filter({ hasText: "remove-me@example.com" });
  await contactRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("remove-me@example.com")).not.toBeVisible();
});

test("removes a Slack contact", async ({ page, adminClient }) => {
  await adminClient.from("contacts").insert({
    type: "slack",
    webhook_url: "https://hooks.slack.com/services/T00/B00/remove-test",
    label: "#ops-alerts",
  });

  await page.goto("/settings");
  const contactRow = page.getByRole("listitem").filter({ hasText: "#ops-alerts" });
  await expect(contactRow).toBeVisible();

  await contactRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("#ops-alerts")).not.toBeVisible();
});
