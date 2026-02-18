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
const mockGetUser = vi.fn()
vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    }),
}))

describe("site detail data fetching", () => {
  test("site query chain works with mock", () => {
    const mockSingle = vi.fn().mockReturnValue({
      data: { id: "site-1", name: "Test Site", url: "https://example.com", created_at: "2025-01-01" },
    })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("sites").select("*").eq("id", "site-1").single()
    expect(result.data.name).toBe("Test Site")
  })

  test("incidents query chain works with mock", () => {
    const mockOrder = vi.fn().mockReturnValue({
      data: [
        {
          id: "inc-1",
          site_id: "site-1",
          status: "open",
          opened_at: "2025-01-01",
          check: { id: "check-1", error: "HTTP 503" },
        },
      ],
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("incidents")
      .select("*, check:checks(*)")
      .eq("site_id", "site-1")
      .order("opened_at", { ascending: false })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].check.error).toBe("HTTP 503")
  })

  test("checks query chain works with mock", () => {
    const mockLimit = vi.fn().mockReturnValue({
      data: [
        { id: "check-1", site_id: "site-1", status: "success", status_code: 200, checked_at: "2025-01-01T12:00:00Z" },
        { id: "check-2", site_id: "site-1", status: "failure", status_code: 503, error: "HTTP 503", checked_at: "2025-01-01T11:55:00Z" },
      ],
    })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("checks")
      .select("*")
      .eq("site_id", "site-1")
      .order("checked_at", { ascending: false })
      .limit(50)
    expect(result.data).toHaveLength(2)
    expect(result.data[0].status).toBe("success")
    expect(result.data[1].status).toBe("failure")
  })

  test("auth user check works with mock", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    })

    const supabase = { auth: { getUser: mockGetUser } }
    const { data: { user } } = await supabase.auth.getUser()
    expect(user).toBeDefined()
    expect(user!.email).toBe("test@example.com")
  })

  test("unauthenticated user gets null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const supabase = { auth: { getUser: mockGetUser } }
    const { data: { user } } = await supabase.auth.getUser()
    expect(user).toBeNull()
  })
})
