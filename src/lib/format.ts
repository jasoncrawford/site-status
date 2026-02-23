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
 * Format a short time like "5:30pm" (no space, lowercase am/pm).
 */
function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? "pm" : "am"
  const h = hours % 12 || 12
  const m = minutes === 0 ? "" : `:${minutes.toString().padStart(2, "0")}`
  return `${h}${m}${ampm}`
}

/**
 * Format a short date like "Feb 19".
 */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Format an incident date range with smart date+time display:
 * - Open: "Feb 19 5:30pm – ongoing"
 * - Same-day resolved: "Feb 19 5:30pm–5:53pm"
 * - Cross-day resolved: "Feb 19 5:30pm – Feb 20 10:15am"
 */
export function formatIncidentRange(
  openedAt: string,
  resolvedAt: string | null
): string {
  const start = new Date(openedAt)
  const startStr = `${formatShortDate(start)} ${formatTime(start)}`

  if (!resolvedAt) {
    return `${startStr} \u2013 ongoing`
  }

  const end = new Date(resolvedAt)
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()

  if (sameDay) {
    return `${startStr}\u2013${formatTime(end)}`
  }

  return `${startStr} \u2013 ${formatShortDate(end)} ${formatTime(end)}`
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
