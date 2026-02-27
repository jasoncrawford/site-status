"use client"

import { useEffect, useReducer } from "react"

/**
 * Forces a re-render at the given interval (in ms).
 * Useful for keeping relative timestamps fresh.
 */
export function useTick(intervalMs: number = 15_000) {
  const [, tick] = useReducer((x: number) => x + 1, 0)

  useEffect(() => {
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
