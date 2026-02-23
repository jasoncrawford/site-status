/**
 * Format a date string as a relative time like "2 min ago", "1 hr ago".
 */
export function formatTimeAgo(dateString: string, now?: Date): string {
  const date = new Date(dateString)
  const current = now ?? new Date()
  const diffMs = current.getTime() - date.getTime()

  if (diffMs < 0) return "just now"

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "just now"
  if (diffMinutes === 1) return "1 min ago"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours === 1) return "1 hr ago"
  if (diffHours < 24) return `${diffHours} hrs ago`
  if (diffDays === 1) return "1 day ago"
  return `${diffDays} days ago`
}

/**
 * Get the user's timezone, falling back to US Pacific.
 */
export function getTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles"
  } catch {
    return "America/Los_Angeles"
  }
}

/**
 * Get a short timezone abbreviation like "PST" or "EST" for the given date and timezone.
 */
function getTimeZoneAbbr(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  }).formatToParts(date)
  return parts.find((p) => p.type === "timeZoneName")?.value ?? ""
}

/**
 * Format a short time like "5:30pm" (no space, lowercase am/pm) in the given timezone.
 */
function formatTime(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date)

  const hour = parts.find((p) => p.type === "hour")?.value ?? "12"
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00"
  const dayPeriod = (parts.find((p) => p.type === "dayPeriod")?.value ?? "AM").toLowerCase()

  const m = minute === "00" ? "" : `:${minute}`
  return `${hour}${m}${dayPeriod}`
}

/**
 * Format a short date like "Feb 19" in the given timezone.
 */
function formatShortDate(date: Date, timeZone: string): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone })
}

/**
 * Format an incident date range with smart date+time display and timezone abbreviation:
 * - Open: "Feb 19 5:30pm – ongoing PST"
 * - Same-day resolved: "Feb 19 5:30pm–5:53pm PST"
 * - Cross-day resolved: "Feb 19 5:30pm – Feb 20 10:15am PST"
 */
export function formatIncidentRange(
  openedAt: string,
  resolvedAt: string | null,
  timeZone: string
): string {
  const start = new Date(openedAt)
  const tz = getTimeZoneAbbr(start, timeZone)
  const startStr = `${formatShortDate(start, timeZone)} ${formatTime(start, timeZone)}`

  if (!resolvedAt) {
    return `${startStr} \u2013 ongoing ${tz}`
  }

  const end = new Date(resolvedAt)
  const startDateStr = formatShortDate(start, timeZone)
  const endDateStr = formatShortDate(end, timeZone)
  const sameDay = startDateStr === endDateStr

  if (sameDay) {
    return `${startStr}\u2013${formatTime(end, timeZone)} ${tz}`
  }

  return `${startStr} \u2013 ${endDateStr} ${formatTime(end, timeZone)} ${tz}`
}

/**
 * Format a date string as "Feb 19, 5:30pm PST" in the given timezone.
 */
export function formatDateTime(dateString: string, timeZone: string): string {
  const date = new Date(dateString)
  const tz = getTimeZoneAbbr(date, timeZone)
  return `${formatShortDate(date, timeZone)}, ${formatTime(date, timeZone)} ${tz}`
}

/**
 * Format a duration from a start time to now, like "23 minutes" or "2 hours".
 */
export function formatDuration(startDateString: string, now?: Date): string {
  const start = new Date(startDateString)
  const current = now ?? new Date()
  const diffMs = current.getTime() - start.getTime()

  if (diffMs < 0) return "0 minutes"

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return "0 minutes"
  if (diffMinutes === 1) return "1 minute"
  if (diffMinutes < 60) return `${diffMinutes} minutes`
  if (diffHours === 1) return "1 hour"
  if (diffHours < 24) return `${diffHours} hours`
  if (diffDays === 1) return "1 day"
  return `${diffDays} days`
}
