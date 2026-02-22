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

import { addSite, editSite, deleteSite, reorderSites } from "@/app/sites/actions"

describe("addSite action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const formData = new FormData()
    formData.set("name", "Test Site")
    formData.set("url", "https://example.com")

    await expect(addSite(formData)).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("inserts site for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockInsert = vi.fn().mockReturnValue({ error: null })
    const mockSingle = vi.fn().mockResolvedValue({ data: { position: 2 } })
    const mockLimit = vi.fn().mockReturnValue({ single: mockSingle })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    mockFrom.mockImplementation((table: string) => {
      // First call: select max position; second call: insert
      if (mockFrom.mock.calls.length <= 1) {
        return { select: mockSelect }
      }
      return { insert: mockInsert }
    })

    const formData = new FormData()
    formData.set("name", "Test Site")
    formData.set("url", "https://example.com")

    await addSite(formData)
    expect(mockFrom).toHaveBeenCalledWith("sites")
    expect(mockInsert).toHaveBeenCalledWith({
      name: "Test Site",
      url: "https://example.com",
      position: 3,
    })
  })

  test("does nothing if name or url is empty", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    formData.set("name", "Test Site")
    // url is missing

    await addSite(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe("editSite action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const formData = new FormData()
    formData.set("name", "Updated")
    formData.set("url", "https://example.com")

    await expect(editSite("site-1", formData)).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    )
  })

  test("updates site for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockEq = vi.fn().mockReturnValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    const formData = new FormData()
    formData.set("name", "Updated Site")
    formData.set("url", "https://updated.com")

    await editSite("site-1", formData)
    expect(mockFrom).toHaveBeenCalledWith("sites")
    expect(mockUpdate).toHaveBeenCalledWith({
      name: "Updated Site",
      url: "https://updated.com",
    })
    expect(mockEq).toHaveBeenCalledWith("id", "site-1")
  })

  test("does nothing if name or url is empty", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    // both fields empty

    await editSite("site-1", formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

describe("deleteSite action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(deleteSite("site-1")).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("deletes site for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockEq = vi.fn().mockReturnValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ delete: mockDelete })

    await deleteSite("site-1")
    expect(mockFrom).toHaveBeenCalledWith("sites")
    expect(mockEq).toHaveBeenCalledWith("id", "site-1")
  })
})

describe("reorderSites action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("redirects unauthenticated users to login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(reorderSites(["a", "b"])).rejects.toThrow(
      "NEXT_REDIRECT:/login"
    )
  })

  test("updates positions for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockEq = vi.fn().mockReturnValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })

    await reorderSites(["site-b", "site-a", "site-c"])
    expect(mockFrom).toHaveBeenCalledWith("sites")
    expect(mockUpdate).toHaveBeenCalledWith({ position: 0 })
    expect(mockUpdate).toHaveBeenCalledWith({ position: 1 })
    expect(mockUpdate).toHaveBeenCalledWith({ position: 2 })
    expect(mockEq).toHaveBeenCalledWith("id", "site-b")
    expect(mockEq).toHaveBeenCalledWith("id", "site-a")
    expect(mockEq).toHaveBeenCalledWith("id", "site-c")
  })
})
