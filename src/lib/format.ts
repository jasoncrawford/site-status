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
