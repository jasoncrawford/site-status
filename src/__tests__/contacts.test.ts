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
const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    }),
}))

import { addContact, deleteContact } from "@/app/settings/actions"

describe("addContact action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const formData = new FormData()
    formData.set("email", "test@example.com")

    await expect(addContact(formData)).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("inserts contact for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockInsert = vi.fn().mockReturnValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const formData = new FormData()
    formData.set("email", "test@example.com")

    await addContact(formData)
    expect(mockFrom).toHaveBeenCalledWith("contacts")
    expect(mockInsert).toHaveBeenCalledWith({ email: "test@example.com" })
  })

  test("does nothing if email is empty", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    await addContact(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe("deleteContact action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(deleteContact("contact-1")).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("deletes contact for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockEq = vi.fn().mockReturnValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    await deleteContact("contact-1")
    expect(mockFrom).toHaveBeenCalledWith("contacts")
    expect(mockEq).toHaveBeenCalledWith("id", "contact-1")
  })
})
