import { describe, test, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Mock Supabase SSR
const mockGetUser = vi.fn()
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

import { middleware } from "@/middleware"

function createRequest(pathname: string) {
  return new NextRequest(new URL(pathname, "http://localhost:3000"))
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321"
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key"
  })

  test("redirects unauthenticated users from /settings to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const response = await middleware(createRequest("/settings"))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/login")
  })

  test("allows unauthenticated users to access /", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const response = await middleware(createRequest("/"))
    expect(response.status).toBe(200)
  })

  test("allows authenticated users to access /settings", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    })

    const response = await middleware(createRequest("/settings"))
    expect(response.status).toBe(200)
  })

  test("redirects authenticated users away from /login", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    })

    const response = await middleware(createRequest("/login"))
    expect(response.status).toBe(307)
    expect(new URL(response.headers.get("location")!).pathname).toBe("/")
  })
})
