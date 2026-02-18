"use client"

import { useMemo } from "react"
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription"

export default function RealtimeIncidentDetail({
  siteId,
  incidentId,
}: {
  siteId: string
  incidentId: string
}) {
  const subscriptions = useMemo(
    () => [
      { table: "checks", filter: `site_id=eq.${siteId}` },
      { table: "incidents", filter: `id=eq.${incidentId}` },
    ],
    [siteId, incidentId]
  )
  useRealtimeSubscription(subscriptions)
  return null
}
