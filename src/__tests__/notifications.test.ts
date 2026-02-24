import { describe, test, expect, vi, beforeEach } from "vitest"

// Mock Resend
const mockSend = vi.fn()
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mockSend }
  },
}))

// Mock fetch for Slack
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

import { sendIncidentEmail, sendIncidentSlack } from "@/lib/notifications"

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

describe("sendIncidentSlack", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("posts to all Slack webhooks with correct content", async () => {
    mockFetch.mockResolvedValue({ ok: true })

    await sendIncidentSlack({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: "HTTP 503",
      incidentId: "inc-1",
      webhookUrls: ["https://hooks.slack.com/services/T00/B00/xxx"],
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe("https://hooks.slack.com/services/T00/B00/xxx")
    expect(options.method).toBe("POST")

    const body = JSON.parse(options.body)
    expect(body.text).toContain("<!channel>")
    expect(body.text).toContain("*Main Website* is down")
    expect(body.text).toContain("https://example.com")
    expect(body.text).toContain("HTTP 503")
    expect(body.text).toContain("/incidents/inc-1")
  })

  test("sends to multiple webhooks", async () => {
    mockFetch.mockResolvedValue({ ok: true })

    await sendIncidentSlack({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: null,
      incidentId: "inc-1",
      webhookUrls: [
        "https://hooks.slack.com/services/T00/B00/aaa",
        "https://hooks.slack.com/services/T00/B00/bbb",
      ],
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][0]).toBe("https://hooks.slack.com/services/T00/B00/aaa")
    expect(mockFetch.mock.calls[1][0]).toBe("https://hooks.slack.com/services/T00/B00/bbb")
  })

  test("does nothing when webhookUrls is empty", async () => {
    await sendIncidentSlack({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: null,
      incidentId: "inc-1",
      webhookUrls: [],
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })

  test("handles fetch failure gracefully and continues", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ ok: true })

    await sendIncidentSlack({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: null,
      incidentId: "inc-1",
      webhookUrls: [
        "https://hooks.slack.com/services/T00/B00/aaa",
        "https://hooks.slack.com/services/T00/B00/bbb",
      ],
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to send Slack alert:",
      expect.any(Error)
    )
    consoleSpy.mockRestore()
  })

  test("logs error when webhook returns non-ok status", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockFetch.mockResolvedValue({ ok: false, status: 403 })

    await sendIncidentSlack({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: null,
      incidentId: "inc-1",
      webhookUrls: ["https://hooks.slack.com/services/T00/B00/xxx"],
    })

    expect(consoleSpy).toHaveBeenCalledWith("Slack webhook returned", 403)
    consoleSpy.mockRestore()
  })

  test("omits error line when error is null", async () => {
    mockFetch.mockResolvedValue({ ok: true })

    await sendIncidentSlack({
      siteName: "Main Website",
      siteUrl: "https://example.com",
      error: null,
      incidentId: "inc-1",
      webhookUrls: ["https://hooks.slack.com/services/T00/B00/xxx"],
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.text).not.toContain("Error:")
  })
})
