import { describe, test, expect, vi, beforeEach } from "vitest"

// Mock Resend
const mockSend = vi.fn()
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend }
  },
}))

// Mock Twilio
const mockCreate = vi.fn()
vi.mock("twilio", () => ({
  default: () => ({
    messages: { create: mockCreate },
  }),
}))

import { sendIncidentEmail, sendIncidentSms } from "@/lib/notifications"

describe("sendIncidentEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ id: "email-1" })
  })

  test("sends email to all contacts with correct content", async () => {
    await sendIncidentEmail({
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
    await sendIncidentEmail({
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

    await sendIncidentEmail({
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
    await sendIncidentEmail({
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

describe("sendIncidentSms", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ sid: "SM123" })
    process.env.TWILIO_FROM_NUMBER = "+10001112222"
  })

  test("sends SMS to all contacts with correct content", async () => {
    await sendIncidentSms({
      siteName: "Main Website",
      incidentId: "inc-1",
      contactPhones: ["+15551234567", "+15559876543"],
    })

    expect(mockCreate).toHaveBeenCalledTimes(2)
    const call1 = mockCreate.mock.calls[0][0]
    expect(call1.to).toBe("+15551234567")
    expect(call1.from).toBe("+10001112222")
    expect(call1.body).toContain("[Down]")
    expect(call1.body).toContain("Main Website")
    expect(call1.body).toContain("/incidents/inc-1")
  })

  test("does nothing when contactPhones is empty", async () => {
    await sendIncidentSms({
      siteName: "Main Website",
      incidentId: "inc-1",
      contactPhones: [],
    })

    expect(mockCreate).not.toHaveBeenCalled()
  })

  test("handles SMS send failure gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockCreate.mockRejectedValue(new Error("Twilio error"))

    await sendIncidentSms({
      siteName: "Main Website",
      incidentId: "inc-1",
      contactPhones: ["+15551234567"],
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to send incident SMS"),
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })

  test("continues sending to remaining contacts if one fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockCreate
      .mockRejectedValueOnce(new Error("Twilio error"))
      .mockResolvedValueOnce({ sid: "SM456" })

    await sendIncidentSms({
      siteName: "Main Website",
      incidentId: "inc-1",
      contactPhones: ["+15551111111", "+15552222222"],
    })

    expect(mockCreate).toHaveBeenCalledTimes(2)
    consoleSpy.mockRestore()
  })
})
