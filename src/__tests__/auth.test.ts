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
}))

// Mock Supabase server client
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
      },
    }),
}))

import { login, logout } from "@/app/login/actions"

describe("login action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("returns error when email or password is missing", async () => {
    const formData = new FormData()
    const result = await login(formData)
    expect(result).toEqual({ error: "Email and password are required" })
  })

  test("returns error on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    })

    const formData = new FormData()
    formData.set("email", "test@example.com")
    formData.set("password", "wrong-password")

    const result = await login(formData)
    expect(result).toEqual({ error: "Invalid email or password" })
  })

  test("redirects to / on successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.set("email", "test@example.com")
    formData.set("password", "correct-password")

    await expect(login(formData)).rejects.toThrow("NEXT_REDIRECT:/")
    expect(mockRedirect).toHaveBeenCalledWith("/")
  })
})

describe("logout action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("signs out and redirects to /login", async () => {
    mockSignOut.mockResolvedValue({ error: null })

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login")
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith("/login")
  })
})
