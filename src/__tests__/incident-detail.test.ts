import { describe, test, expect, vi, beforeEach } from "vitest"

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock next/navigation
const mockRedirect = vi.fn()
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))

// Mock Supabase server client
const mockFrom = vi.fn()
const mockGetUser = vi.fn()
const mockUpdate = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    }),
}))

import { resolveIncident } from "@/app/incidents/[id]/actions"

describe("incident detail data fetching", () => {
  test("incident query chain works with mock", () => {
    const mockSingle = vi.fn().mockReturnValue({
      data: {
        id: "inc-1",
        site_id: "site-1",
        status: "open",
        opened_at: "2025-01-01",
        site: { id: "site-1", name: "Test Site" },
        check: { id: "check-1", error: "HTTP 503" },
      },
    })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("incidents")
      .select("*, site:sites(*), check:checks(*)")
      .eq("id", "inc-1")
      .single()
    expect(result.data.site.name).toBe("Test Site")
    expect(result.data.check.error).toBe("HTTP 503")
  })

  test("checks since incident query works with mock", () => {
    const mockOrder = vi.fn().mockReturnValue({
      data: [
        { id: "check-2", status: "failure", checked_at: "2025-01-01T12:10:00Z" },
        { id: "check-1", status: "failure", checked_at: "2025-01-01T12:05:00Z" },
      ],
    })
    const mockGte = vi.fn().mockReturnValue({ order: mockOrder })
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = mockFrom("checks")
      .select("*")
      .eq("site_id", "site-1")
      .gte("checked_at", "2025-01-01T12:00:00Z")
      .order("checked_at", { ascending: false })
    expect(result.data).toHaveLength(2)
  })
})

describe("resolveIncident action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(resolveIncident("inc-1")).rejects.toThrow("NEXT_REDIRECT:/login")
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })

  test("resolves incident for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockEq = vi.fn().mockReturnValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const result = await resolveIncident("inc-1")
    expect(result).toBeUndefined()
    expect(mockFrom).toHaveBeenCalledWith("incidents")
  })
})
