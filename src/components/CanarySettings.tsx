"use client"

import { useOptimistic, useTransition } from "react"
import { updateCanaryStatusCode } from "@/app/settings/actions"

const STATUS_CODES = [
  { code: 200, name: "OK", color: "#2D6A2D" },
  { code: 301, name: "Moved Permanently", color: "#C4453C" },
  { code: 302, name: "Found", color: "#C4453C" },
  { code: 400, name: "Bad Request", color: "#C4453C" },
  { code: 401, name: "Unauthorized", color: "#C4453C" },
  { code: 403, name: "Forbidden", color: "#C4453C" },
  { code: 404, name: "Not Found", color: "#C4453C" },
  { code: 408, name: "Request Timeout", color: "#C4453C" },
  { code: 500, name: "Internal Server Error", color: "#C4453C" },
  { code: 502, name: "Bad Gateway", color: "#D4880F" },
  { code: 503, name: "Service Unavailable", color: "#D4880F" },
  { code: 504, name: "Gateway Timeout", color: "#D4880F" },
] as const

export default function CanarySettings({ currentCode }: { currentCode: number }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticCode, setOptimisticCode] = useOptimistic(currentCode)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCode = parseInt(e.target.value, 10)
    startTransition(async () => {
      setOptimisticCode(newCode)
      await updateCanaryStatusCode(newCode)
    })
  }

  const current = STATUS_CODES.find((s) => s.code === optimisticCode)

  return (
    <div className="flex items-center gap-3">
      <select
        value={optimisticCode}
        onChange={handleChange}
        disabled={isPending}
        className="text-sm px-2 py-2 rounded"
        style={{
          border: "1px solid #E8E4DF",
          backgroundColor: "#FFFFFF",
          color: "#1A1A1A",
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {STATUS_CODES.map(({ code, name, color }) => (
          <option key={code} value={code}>
            {code === 200 ? "\u{1F7E2}" : color === "#D4880F" ? "\u{1F7E1}" : "\u{1F534}"}{" "}
            {code} {name}
          </option>
        ))}
      </select>
      {current && (
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: current.color }}
        />
      )}
    </div>
  )
}
