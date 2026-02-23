"use client"

import type { Check } from "@/lib/supabase/types"
import { isSoftFailure } from "@/lib/checker"
import { LocalDateTime } from "@/components/LocalTime"

function checkDotColor(check: Check): string {
  if (check.status !== "failure") return "#2DA44E"
  return isSoftFailure(check.status_code, check.error) ? "#D4A017" : "#C4453C"
}

export default function CheckLogTable({
  checks,
  triggeringCheckId,
}: {
  checks: Check[]
  triggeringCheckId?: string
}) {
  return (
    <div
      className="rounded overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E4DF" }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className="text-left text-xs font-semibold uppercase px-5 py-2.5"
              style={{
                color: "#807B74",
                letterSpacing: "0.04em",
                borderBottom: "1px solid #E8E4DF",
                backgroundColor: "#FDFCFB",
              }}
            >
              Timestamp
            </th>
            <th
              className="text-left text-xs font-semibold uppercase px-5 py-2.5"
              style={{
                color: "#807B74",
                letterSpacing: "0.04em",
                borderBottom: "1px solid #E8E4DF",
                backgroundColor: "#FDFCFB",
              }}
            >
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {checks.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-5 py-3 text-sm" style={{ color: "#5C5C5C" }}>
                No checks recorded yet.
              </td>
            </tr>
          ) : (
            checks.map((check, i) => {
              const dotColor = checkDotColor(check)
              const isFailure = check.status === "failure"
              const isTriggering = triggeringCheckId === check.id
              return (
                <tr
                  key={check.id}
                  className="transition-colors"
                  style={{
                    borderBottom:
                      i < checks.length - 1 ? "1px solid #F0EEEA" : undefined,
                  }}
                >
                  <td
                    className="px-5 py-2.5 text-sm whitespace-nowrap"
                    style={{ color: "#5C5C5C", fontVariantNumeric: "tabular-nums" }}
                  >
                    <LocalDateTime dateString={check.checked_at} />
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: dotColor }}
                      >
                        {isFailure
                          ? check.error ?? "Failure"
                          : `HTTP ${check.status_code ?? 200} OK`}
                      </span>
                      {isTriggering && (
                        <span
                          className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded whitespace-nowrap"
                          style={{
                            letterSpacing: "0.04em",
                            color: "#C4453C",
                            backgroundColor: "rgba(196, 69, 60, 0.08)",
                          }}
                        >
                          Triggered incident
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
