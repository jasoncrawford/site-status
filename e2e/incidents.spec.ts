import { test, expect } from "./fixtures";

// Each test seeds its own incident, so they can't run in parallel within this file
test.describe.configure({ mode: "serial" });

let incidentId: string;

test.beforeEach(async ({ adminClient, testData }) => {
  // Clean up any previous incidents/checks
  await adminClient.from("incidents").delete().eq("site_id", testData.siteId);
  await adminClient.from("checks").delete().eq("site_id", testData.siteId);

  // Insert a failing check
  const { data: check } = await adminClient
    .from("checks")
    .insert({
      site_id: testData.siteId,
      status: "failure",
      error: "Connection timeout",
      checked_at: new Date().toISOString(),
    })
    .select()
    .single();

  // Insert an open incident
  const { data: incident } = await adminClient
    .from("incidents")
    .insert({
      site_id: testData.siteId,
      check_id: check!.id,
      status: "open",
      opened_at: new Date().toISOString(),
    })
    .select()
    .single();
  incidentId = incident!.id;
});

test.afterEach(async ({ adminClient, testData }) => {
  await adminClient.from("incidents").delete().eq("site_id", testData.siteId);
  await adminClient.from("checks").delete().eq("site_id", testData.siteId);
});

test("shows Open Incidents section on status page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Open Incidents" })).toBeVisible();
  // Site name appears in the incident card within Open Incidents section
  const incidentsSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Open Incidents" }),
  });
  await expect(incidentsSection.getByText("E2E Test Site")).toBeVisible();
});

test("navigates to incident detail", async ({ page }) => {
  await page.goto("/");
  await page.locator(`a[href="/incidents/${incidentId}"]`).click();
  await expect(page.getByRole("heading", { name: "Incident on E2E Test Site" })).toBeVisible();
});

test("shows Open badge and Resolve button", async ({ page }) => {
  await page.goto(`/incidents/${incidentId}`);
  await expect(page.getByText("Open", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve" })).toBeVisible();
});

test("resolves an incident", async ({ page }) => {
  await page.goto(`/incidents/${incidentId}`);
  await page.getByRole("button", { name: "Resolve" }).click();

  await expect(page.getByText("Resolved", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve" })).not.toBeVisible();
});

test("resolved incident no longer appears in Open Incidents", async ({ page }) => {
  await page.goto(`/incidents/${incidentId}`);
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByText("Resolved", { exact: true })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Open Incidents" })).not.toBeVisible();
});
