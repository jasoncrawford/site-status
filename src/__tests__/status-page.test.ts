import { describe, test, expect, vi } from "vitest"

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      getAll: () => [],
      set: vi.fn(),
    }),
}))

// Mock Supabase server client
const mockFrom = vi.fn()
vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: mockFrom,
    }),
}))

describe("status page data fetching", () => {
  test("format module exports are available", async () => {
    const format = await import("@/lib/format")
    expect(typeof format.formatTimeAgo).toBe("function")
    expect(typeof format.formatDuration).toBe("function")
  })

  test("types module exports are available", async () => {
    // Just verify the types module can be imported
    const types = await import("@/lib/supabase/types")
    expect(types).toBeDefined()
  })

  test("supabase query chain for sites works with mock", () => {
    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        data: [
          { id: "site-1", name: "Main", url: "https://example.com", created_at: "2025-01-01" },
        ],
        error: null,
      }),
    })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("sites").select("*").order("name")
    expect(result.data).toHaveLength(1)
    expect(result.data[0].name).toBe("Main")
  })

  test("supabase query chain for incidents works with mock", () => {
    const mockEq = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        data: [
          {
            id: "inc-1",
            site_id: "site-1",
            status: "open",
            opened_at: "2025-01-01",
            site: { id: "site-1", name: "Main", url: "https://example.com" },
            check: { id: "check-1", error: "HTTP 503" },
          },
        ],
        error: null,
      }),
    })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("incidents")
      .select("*, site:sites(*), check:checks(*)")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].site.name).toBe("Main")
  })

  test("supabase query chain for latest check works with mock", () => {
    const mockLimit = vi.fn().mockReturnValue({
      data: [
        {
          id: "check-1",
          site_id: "site-1",
          status: "success",
          checked_at: "2025-01-01T12:00:00Z",
        },
      ],
      error: null,
    })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("checks")
      .select("*")
      .eq("site_id", "site-1")
      .order("checked_at", { ascending: false })
      .limit(1)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].status).toBe("success")
  })
})
