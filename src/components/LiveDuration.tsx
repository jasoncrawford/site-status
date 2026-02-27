"use client"

import { formatDuration } from "@/lib/format"
import { useTick } from "@/hooks/useTick"

export default function LiveDuration({ since }: { since: string }) {
  useTick(15_000)
  return <>Down for {formatDuration(since)}</>
}
