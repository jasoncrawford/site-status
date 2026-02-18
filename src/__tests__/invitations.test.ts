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

// Mock crypto
vi.mock("crypto", () => ({
  randomBytes: () => ({
    toString: () => "mock-token-abc123",
  }),
}))

// Mock Resend
const mockSend = vi.fn()
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend }
  },
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

// Mock Supabase admin client
const mockAdminFrom = vi.fn()
const mockAdminCreateUser = vi.fn()

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockAdminFrom,
    auth: { admin: { createUser: mockAdminCreateUser } },
  }),
}))

import { sendInvitation, revokeInvitation } from "@/app/settings/invite-actions"
import { acceptInvitation } from "@/app/invite/[token]/actions"

describe("sendInvitation action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: "email-1" })
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const formData = new FormData()
    formData.set("email", "new@example.com")

    await expect(sendInvitation(formData)).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("creates invitation and sends email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockInsert = vi.fn().mockReturnValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const formData = new FormData()
    formData.set("email", "new@example.com")

    await sendInvitation(formData)

    expect(mockFrom).toHaveBeenCalledWith("invitations")
    expect(mockInsert).toHaveBeenCalledWith({
      email: "new@example.com",
      invited_by: "user-1",
      token: "mock-token-abc123",
    })
    expect(mockSend).toHaveBeenCalledTimes(1)
    const emailCall = mockSend.mock.calls[0][0]
    expect(emailCall.to).toEqual(["new@example.com"])
    expect(emailCall.html).toContain("mock-token-abc123")
  })

  test("does nothing if email is empty", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    await sendInvitation(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe("revokeInvitation action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(revokeInvitation("inv-1")).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("deletes invitation for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockEq = vi.fn().mockReturnValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    await revokeInvitation("inv-1")
    expect(mockFrom).toHaveBeenCalledWith("invitations")
    expect(mockEq).toHaveBeenCalledWith("id", "inv-1")
  })
})

describe("acceptInvitation action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("returns error for short password", async () => {
    const formData = new FormData()
    formData.set("password", "short")

    const result = await acceptInvitation("some-token", formData)
    expect(result).toEqual({ error: "Password must be at least 8 characters" })
  })

  test("returns error for invalid or used token", async () => {
    const mockSingle = vi.fn().mockReturnValue({ data: null })
    const mockIs = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockAdminFrom.mockReturnValue({ select: mockSelect })

    const formData = new FormData()
    formData.set("password", "password123")

    const result = await acceptInvitation("invalid-token", formData)
    expect(result).toEqual({ error: "This invitation is invalid or has already been used" })
  })

  test("creates user and marks invitation as accepted", async () => {
    const invitation = {
      id: "inv-1",
      email: "new@example.com",
      token: "valid-token",
    }

    const mockSingle = vi.fn().mockReturnValue({ data: invitation })
    const mockIs = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

    const mockUpdateEq = vi.fn().mockReturnValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === "invitations") {
        return { select: mockSelect, update: mockUpdate }
      }
      return {}
    })

    mockAdminCreateUser.mockResolvedValue({ error: null })

    const formData = new FormData()
    formData.set("password", "password123")

    await expect(acceptInvitation("valid-token", formData)).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    )

    expect(mockAdminCreateUser).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password123",
      email_confirm: true,
    })
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ accepted_at: expect.any(String) })
    )
  })

  test("returns error when email already registered", async () => {
    const invitation = {
      id: "inv-1",
      email: "existing@example.com",
      token: "valid-token",
    }

    const mockSingle = vi.fn().mockReturnValue({ data: invitation })
    const mockIs = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockAdminFrom.mockReturnValue({ select: mockSelect })

    mockAdminCreateUser.mockResolvedValue({
      error: { message: "A user with this email address has already been registered" },
    })

    const formData = new FormData()
    formData.set("password", "password123")

    const result = await acceptInvitation("valid-token", formData)
    expect(result).toEqual({ error: "This email is already registered" })
  })
})
