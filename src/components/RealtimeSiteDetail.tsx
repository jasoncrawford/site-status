"use client"

import { useMemo } from "react"
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription"

export default function RealtimeSiteDetail({ siteId }: { siteId: string }) {
  const subscriptions = useMemo(
    () => [
      { table: "checks", filter: `site_id=eq.${siteId}` },
      { table: "incidents", filter: `site_id=eq.${siteId}` },
    ],
    [siteId]
  )
  useRealtimeSubscription(subscriptions)
  return null
}
