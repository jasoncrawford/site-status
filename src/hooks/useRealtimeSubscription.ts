"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type SubscriptionConfig = {
  table: string
  filter?: string
}

export function useRealtimeSubscription(subscriptions: SubscriptionConfig[]) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("realtime-updates")

    for (const sub of subscriptions) {
      const config: Record<string, string> = {
        event: "*",
        schema: "public",
        table: sub.table,
      }
      if (sub.filter) {
        config.filter = sub.filter
      }
      channel.on("postgres_changes" as never, config, () => {
        router.refresh()
      })
    }

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, subscriptions])
}
