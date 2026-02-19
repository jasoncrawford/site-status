import { test as base, expect } from "@playwright/test";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

type TestData = {
  userId: string;
  siteId: string;
};

type Fixtures = {
  adminClient: SupabaseClient;
  testData: TestData;
};

export const test = base.extend<Fixtures>({
  adminClient: async ({}, use) => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await use(client);
  },
  testData: async ({}, use) => {
    const data = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, ".test-data.json"), "utf-8")
    );
    await use(data);
  },
});

export { expect };
