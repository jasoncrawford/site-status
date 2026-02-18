import { describe, test, expect, vi, beforeEach } from "vitest"

// Mock Resend
const mockSend = vi.fn()
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend }
  },
}))

import { sendIncidentAlert } from "@/lib/notifications"

describe("sendIncidentAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: "email-1" })
  })

  test("sends email to all contacts with correct content", async () => {
    await sendIncidentAlert({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: "HTTP 503",
      incidentId: "inc-1",
      contactEmails: ["alice@example.com", "bob@example.com"],
    })

    expect(mockSend).toHaveBeenCalledTimes(1)
    const call = mockSend.mock.calls[0][0]
    expect(call.to).toEqual(["alice@example.com", "bob@example.com"])
    expect(call.subject).toContain("Main Website")
    expect(call.subject).toContain("[Down]")
    expect(call.html).toContain("Main Website")
    expect(call.html).toContain("https://example.com")
    expect(call.html).toContain("HTTP 503")
    expect(call.html).toContain("/incidents/inc-1")
  })

  test("does nothing when contactEmails is empty", async () => {
    await sendIncidentAlert({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: "HTTP 503",
      incidentId: "inc-1",
      contactEmails: [],
    })

    expect(mockSend).not.toHaveBeenCalled()
  })

  test("handles email send failure gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockSend.mockRejectedValue(new Error("API rate limit"))

    await sendIncidentAlert({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: "HTTP 503",
      incidentId: "inc-1",
      contactEmails: ["alice@example.com"],
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to send incident alert email:",
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })

  test("works without error field", async () => {
    await sendIncidentAlert({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: null,
      incidentId: "inc-1",
      contactEmails: ["alice@example.com"],
    })

    const call = mockSend.mock.calls[0][0]
    expect(call.html).not.toContain("<strong>Error:</strong>")
  })
})
