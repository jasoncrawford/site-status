import { describe, test, expect } from "vitest"
import { formatTimeAgo, formatDuration } from "@/lib/format"

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
