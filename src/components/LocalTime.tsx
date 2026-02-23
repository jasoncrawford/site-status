"use client"

import { getTimeZone, formatIncidentRange, formatDateTime } from "@/lib/format"

export function LocalIncidentRange({
  openedAt,
  resolvedAt,
}: {
  openedAt: string
  resolvedAt: string | null
}) {
  const tz = getTimeZone()
  return (
    <span suppressHydrationWarning>
      {formatIncidentRange(openedAt, resolvedAt, tz)}
    </span>
  )
}

export function LocalDateTime({ dateString }: { dateString: string }) {
  const tz = getTimeZone()
  return (
    <span suppressHydrationWarning>
      {formatDateTime(dateString, tz)}
    </span>
  )
}
