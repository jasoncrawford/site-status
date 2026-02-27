"use client"

import { useState, useEffect } from "react"
import { getTimeZone, formatIncidentRange, formatDateTime } from "@/lib/format"

function useIsClient() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])
  return isClient
}

export function LocalIncidentRange({
  openedAt,
  resolvedAt,
}: {
  openedAt: string
  resolvedAt: string | null
}) {
  const isClient = useIsClient()
  if (!isClient) {
    return <span style={{ visibility: "hidden" }}>Loading…</span>
  }
  const tz = getTimeZone()
  return <span>{formatIncidentRange(openedAt, resolvedAt, tz)}</span>
}

export function LocalDateTime({ dateString }: { dateString: string }) {
  const isClient = useIsClient()
  if (!isClient) {
    return <span style={{ visibility: "hidden" }}>Loading…</span>
  }
  const tz = getTimeZone()
  return <span>{formatDateTime(dateString, tz)}</span>
}
