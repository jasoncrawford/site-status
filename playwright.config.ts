import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  outputDir: isCI ? "/tmp/test-results" : "./test-results",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: "html",
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Public tests (no auth) — includes auth.spec which does logout/re-auth
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testMatch: [/auth\.spec\.ts/, /status-page\.spec\.ts/],
    },
    {
      // Authenticated tests — run after public so auth.spec's logout + re-auth is done
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["public"],
      testMatch: [/contacts\.spec\.ts/, /sites-crud\.spec\.ts/, /incidents\.spec\.ts/],
    },
  ],
  webServer: {
    command: isCI ? "npm run start -- -p 3100" : "npm run dev -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !isCI,
  },
});
