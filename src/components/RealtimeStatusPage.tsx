"use client"

import { useMemo } from "react"
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription"

export default function RealtimeStatusPage() {
  const subscriptions = useMemo(
    () => [
      { table: "checks" },
      { table: "incidents" },
      { table: "sites" },
    ],
    []
  )
  useRealtimeSubscription(subscriptions)
  return null
}
