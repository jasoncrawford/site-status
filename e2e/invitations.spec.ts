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

  // The invitations section has its own email input — locate it by the section
  const invitationsSection = page.locator("text=Invite new administrators by email.").locator("..");
  await invitationsSection.getByPlaceholder("email@example.com").fill("invite@example.com");
  await invitationsSection.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("invite@example.com")).toBeVisible();
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
