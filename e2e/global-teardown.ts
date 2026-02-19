import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

export default async function globalTeardown() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Clean all tables
  await admin.from("incidents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("checks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await admin.from("sites").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Delete test user
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const testUser = existingUsers?.users?.find(
    (u) => u.email === "e2e-test@example.com"
  );
  if (testUser) {
    await admin.auth.admin.deleteUser(testUser.id);
  }

  // Clean up generated files
  const testDataPath = path.resolve(__dirname, ".test-data.json");
  if (fs.existsSync(testDataPath)) fs.unlinkSync(testDataPath);

  const authDir = path.resolve(__dirname, ".auth");
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true });
  }
}
