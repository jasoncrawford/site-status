import { describe, test, expect } from "vitest"
import { formatTimeAgo, formatDuration, formatIncidentRange, formatDateTime } from "@/lib/format"

const now = new Date("2025-06-15T12:00:00Z")

describe("formatTimeAgo", () => {
  test("returns 'just now' for times less than 60 seconds ago", () => {
    expect(formatTimeAgo("2025-06-15T11:59:30Z", now)).toBe("just now")
  })

  test("returns '1 min ago' for exactly 1 minute", () => {
    expect(formatTimeAgo("2025-06-15T11:59:00Z", now)).toBe("1 min ago")
  })

  test("returns 'N min ago' for minutes", () => {
    expect(formatTimeAgo("2025-06-15T11:55:00Z", now)).toBe("5 min ago")
  })

  test("returns '1 hr ago' for exactly 1 hour", () => {
    expect(formatTimeAgo("2025-06-15T11:00:00Z", now)).toBe("1 hr ago")
  })

  test("returns 'N hrs ago' for hours", () => {
    expect(formatTimeAgo("2025-06-15T09:00:00Z", now)).toBe("3 hrs ago")
  })

  test("returns '1 day ago' for exactly 1 day", () => {
    expect(formatTimeAgo("2025-06-14T12:00:00Z", now)).toBe("1 day ago")
  })

  test("returns 'N days ago' for multiple days", () => {
    expect(formatTimeAgo("2025-06-12T12:00:00Z", now)).toBe("3 days ago")
  })

  test("returns 'just now' for future dates", () => {
    expect(formatTimeAgo("2025-06-15T13:00:00Z", now)).toBe("just now")
  })
})

describe("formatDuration", () => {
  test("returns '0 minutes' for less than a minute", () => {
    expect(formatDuration("2025-06-15T11:59:30Z", now)).toBe("0 minutes")
  })

  test("returns '1 minute' for exactly 1 minute", () => {
    expect(formatDuration("2025-06-15T11:59:00Z", now)).toBe("1 minute")
  })

  test("returns 'N minutes' for minutes", () => {
    expect(formatDuration("2025-06-15T11:37:00Z", now)).toBe("23 minutes")
  })

  test("returns '1 hour' for exactly 1 hour", () => {
    expect(formatDuration("2025-06-15T11:00:00Z", now)).toBe("1 hour")
  })

  test("returns 'N hours' for multiple hours", () => {
    expect(formatDuration("2025-06-15T09:00:00Z", now)).toBe("3 hours")
  })

  test("returns '1 day' for exactly 1 day", () => {
    expect(formatDuration("2025-06-14T12:00:00Z", now)).toBe("1 day")
  })

  test("returns 'N days' for multiple days", () => {
    expect(formatDuration("2025-06-12T12:00:00Z", now)).toBe("3 days")
  })
})

describe("formatIncidentRange", () => {
  test("shows ongoing with timezone abbreviation", () => {
    const result = formatIncidentRange("2025-06-15T17:30:00Z", null, "America/New_York")
    expect(result).toBe("Jun 15 1:30pm \u2013 ongoing EDT")
  })

  test("shows same-day range with timezone", () => {
    const result = formatIncidentRange(
      "2025-06-15T17:30:00Z",
      "2025-06-15T18:53:00Z",
      "America/New_York"
    )
    expect(result).toBe("Jun 15 1:30pm\u20132:53pm EDT")
  })

  test("shows cross-day range with timezone", () => {
    const result = formatIncidentRange(
      "2025-06-15T23:30:00Z",
      "2025-06-16T10:15:00Z",
      "America/New_York"
    )
    expect(result).toBe("Jun 15 7:30pm \u2013 Jun 16 6:15am EDT")
  })

  test("formats correctly in UTC", () => {
    const result = formatIncidentRange("2025-06-15T17:30:00Z", null, "UTC")
    expect(result).toBe("Jun 15 5:30pm \u2013 ongoing UTC")
  })

  test("formats correctly in US Pacific", () => {
    const result = formatIncidentRange(
      "2025-06-15T17:30:00Z",
      "2025-06-15T18:53:00Z",
      "America/Los_Angeles"
    )
    expect(result).toBe("Jun 15 10:30am\u201311:53am PDT")
  })

  test("handles cross-day boundary due to timezone offset", () => {
    // 2025-01-15 03:00 UTC = 2025-01-14 in Pacific (PST = UTC-8)
    const result = formatIncidentRange(
      "2025-01-15T03:00:00Z",
      "2025-01-15T10:00:00Z",
      "America/Los_Angeles"
    )
    // Start: Jan 14 7pm, End: Jan 15 2am — cross-day in Pacific
    expect(result).toBe("Jan 14 7pm \u2013 Jan 15 2am PST")
  })
})

describe("formatDateTime", () => {
  test("formats date and time with timezone in Eastern", () => {
    const result = formatDateTime("2025-06-15T17:30:00Z", "America/New_York")
    expect(result).toBe("Jun 15, 1:30pm EDT")
  })

  test("formats date and time with timezone in UTC", () => {
    const result = formatDateTime("2025-06-15T17:30:00Z", "UTC")
    expect(result).toBe("Jun 15, 5:30pm UTC")
  })

  test("formats date and time with timezone in Pacific", () => {
    const result = formatDateTime("2025-06-15T17:30:00Z", "America/Los_Angeles")
    expect(result).toBe("Jun 15, 10:30am PDT")
  })

  test("omits minutes when on the hour", () => {
    const result = formatDateTime("2025-06-15T17:00:00Z", "UTC")
    expect(result).toBe("Jun 15, 5pm UTC")
  })

  test("shows winter timezone abbreviation (PST vs PDT)", () => {
    const result = formatDateTime("2025-01-15T20:00:00Z", "America/Los_Angeles")
    expect(result).toBe("Jan 15, 12pm PST")
  })
})
