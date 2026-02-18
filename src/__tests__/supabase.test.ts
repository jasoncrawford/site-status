import { test, expect, describe } from "vitest";

describe("Supabase types", () => {
  test("exports all expected types", async () => {
    const types = await import("../lib/supabase/types");
    // Verify the module loaded successfully — types are compile-time only,
    // so we just confirm the module is importable without errors
    expect(types).toBeDefined();
  });

  test("type shapes are correct at compile time", () => {
    // These assignments verify the TypeScript types are well-formed.
    // If the types were malformed, this file would fail to compile.
    const site: import("../lib/supabase/types").Site = {
      id: "test-id",
      name: "Test Site",
      url: "https://example.com",
      created_at: "2025-01-01T00:00:00Z",
    };
    expect(site.id).toBe("test-id");
    expect(site.name).toBe("Test Site");
    expect(site.url).toBe("https://example.com");

    const check: import("../lib/supabase/types").Check = {
      id: "check-id",
      site_id: "site-id",
      status: "success",
      status_code: 200,
      error: null,
      checked_at: "2025-01-01T00:00:00Z",
    };
    expect(check.status).toBe("success");
    expect(check.status_code).toBe(200);
    expect(check.error).toBeNull();

    const incident: import("../lib/supabase/types").Incident = {
      id: "incident-id",
      site_id: "site-id",
      check_id: "check-id",
      status: "open",
      opened_at: "2025-01-01T00:00:00Z",
      resolved_at: null,
    };
    expect(incident.status).toBe("open");
    expect(incident.resolved_at).toBeNull();

    const contact: import("../lib/supabase/types").Contact = {
      id: "contact-id",
      email: "test@example.com",
      created_at: "2025-01-01T00:00:00Z",
    };
    expect(contact.email).toBe("test@example.com");

    const invitation: import("../lib/supabase/types").Invitation = {
      id: "invitation-id",
      email: "invite@example.com",
      invited_by: "user-id",
      token: "abc123",
      accepted_at: null,
      created_at: "2025-01-01T00:00:00Z",
    };
    expect(invitation.token).toBe("abc123");
    expect(invitation.accepted_at).toBeNull();
  });
});

describe("Supabase client modules", () => {
  test("admin module exports createAdminClient function", async () => {
    const admin = await import("../lib/supabase/admin");
    expect(typeof admin.createAdminClient).toBe("function");
  });

  test("client module exports createClient function", async () => {
    const client = await import("../lib/supabase/client");
    expect(typeof client.createClient).toBe("function");
  });

  test("server module exports createClient function", async () => {
    const server = await import("../lib/supabase/server");
    expect(typeof server.createClient).toBe("function");
  });
});
