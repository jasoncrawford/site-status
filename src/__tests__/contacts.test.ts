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
    formData.set("contact_email", "test@example.com")

    await expect(addContact(formData)).rejects.toThrow("NEXT_REDIRECT:/login")
  })

  test("inserts email contact for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockInsert = vi.fn().mockReturnValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const formData = new FormData()
    formData.set("contact_type", "email")
    formData.set("contact_email", "test@example.com")

    await addContact(formData)
    expect(mockFrom).toHaveBeenCalledWith("contacts")
    expect(mockInsert).toHaveBeenCalledWith({ type: "email", email: "test@example.com" })
  })

  test("inserts Slack contact for authenticated users", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockInsert = vi.fn().mockReturnValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const formData = new FormData()
    formData.set("contact_type", "slack")
    formData.set("contact_label", "#alerts")
    formData.set("contact_webhook_url", "https://hooks.slack.com/services/T00/B00/xxx")

    await addContact(formData)
    expect(mockFrom).toHaveBeenCalledWith("contacts")
    expect(mockInsert).toHaveBeenCalledWith({
      type: "slack",
      webhook_url: "https://hooks.slack.com/services/T00/B00/xxx",
      label: "#alerts",
    })
  })

  test("rejects invalid Slack webhook URL", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    formData.set("contact_type", "slack")
    formData.set("contact_webhook_url", "https://example.com/not-slack")

    await addContact(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  test("does nothing if email is empty", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    formData.set("contact_type", "email")
    await addContact(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  test("does nothing if webhook URL is empty for Slack", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    formData.set("contact_type", "slack")
    formData.set("contact_label", "#alerts")
    await addContact(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  test("does nothing if label is empty for Slack", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const formData = new FormData()
    formData.set("contact_type", "slack")
    formData.set("contact_webhook_url", "https://hooks.slack.com/services/T00/B00/xxx")
    await addContact(formData)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  test("defaults to email type when contact_type is not set", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    })

    const mockInsert = vi.fn().mockReturnValue({ error: null })
    mockFrom.mockReturnValue({ insert: mockInsert })

    const formData = new FormData()
    formData.set("contact_email", "test@example.com")

    await addContact(formData)
    expect(mockInsert).toHaveBeenCalledWith({ type: "email", email: "test@example.com" })
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
