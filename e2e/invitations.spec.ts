import { test, expect } from "./fixtures";

test.afterEach(async ({ adminClient }) => {
  await adminClient
    .from("invitations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
});

test("shows Invitations heading on settings page", async ({ page }) => {
  await page.goto("/settings");
  await expect(
    page.getByRole("heading", { name: "Invitations" })
  ).toBeVisible();
});

test("shows empty state", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByText("No pending invitations.")).toBeVisible();
});

test("sends an invitation", async ({ page }) => {
  await page.goto("/settings");

  await page.getByPlaceholder("invite@example.com").fill("newuser@example.com");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("newuser@example.com")).toBeVisible();
});

test("revokes an invitation", async ({ page, adminClient, testData }) => {
  // Seed an invitation
  await adminClient.from("invitations").insert({
    email: "revoke-me@example.com",
    invited_by: testData.userId,
    token: "test-token-revoke",
  });

  await page.goto("/settings");
  await expect(page.getByText("revoke-me@example.com")).toBeVisible();

  // Click the Revoke button next to the specific invitation
  const invitationRow = page
    .getByRole("listitem")
    .filter({ hasText: "revoke-me@example.com" });
  await invitationRow.getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByText("revoke-me@example.com")).not.toBeVisible();
});
