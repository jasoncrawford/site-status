"use client"

import { useMemo } from "react"
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription"

export default function RealtimeAllIncidents() {
  const subscriptions = useMemo(
    () => [
      { table: "incidents" },
    ],
    []
  )
  useRealtimeSubscription(subscriptions)
  return null
}
