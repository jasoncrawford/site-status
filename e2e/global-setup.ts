import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Clean all tables
  await admin.from("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("checks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("sites").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Delete existing test user if present
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email === "e2e-test@example.com"
  );
  if (existingUser) {
    await admin.auth.admin.deleteUser(existingUser.id);
  }

  // Create test user
  const { data: userData, error: userError } =
    await admin.auth.admin.createUser({
      email: "e2e-test@example.com",
      password: "test-password-123",
      email_confirm: true,
    });
  if (userError) throw new Error(`Failed to create test user: ${userError.message}`);

  // Seed one baseline site
  const { data: siteData, error: siteError } = await admin
    .from("sites")
    .insert({ name: "E2E Test Site", url: "https://httpbin.org/status/200" })
    .select()
    .single();
  if (siteError) throw new Error(`Failed to seed site: ${siteError.message}`);

  // Write test data for specs to consume
  const testData = {
    userId: userData.user.id,
    siteId: siteData.id,
  };
  fs.writeFileSync(
    path.resolve(__dirname, ".test-data.json"),
    JSON.stringify(testData, null, 2)
  );
}
