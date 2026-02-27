import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Site, Check, Incident } from "@/lib/supabase/types"
import { LocalIncidentRange } from "@/components/LocalTime"
import RealtimeAllIncidents from "@/components/RealtimeAllIncidents"

export const revalidate = 0

type IncidentWithSiteAndCheck = Incident & { site: Site; check: Check }

async function getAllIncidents() {
  const supabase = await createClient()

  const { data: incidents } = await supabase
    .from("incidents")
    .select("*, site:sites(*), check:checks(*)")
    .order("status", { ascending: true }) // "open" before "resolved"
    .order("opened_at", { ascending: false })

  return (incidents ?? []) as IncidentWithSiteAndCheck[]
}

export default async function AllIncidentsPage() {
  const incidents = await getAllIncidents()

  return (
    <main
      className="max-w-[960px] mx-auto"
      style={{ padding: "36px 24px 80px" }}
    >
      <RealtimeAllIncidents />
      <div className="mb-7">
        <Link
          href="/"
          className="text-sm no-underline"
          style={{ color: "#C4453C" }}
        >
          &larr; Status
        </Link>
      </div>

      <h1
        className="text-3xl font-bold mb-6"
        style={{ color: "#1A1A1A", letterSpacing: "-0.01em" }}
      >
        All Incidents
      </h1>

      <div
        className="rounded overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E4DF" }}
      >
        {incidents.length === 0 ? (
          <div className="px-5 py-4 text-sm" style={{ color: "#5C5C5C" }}>
            No incidents recorded.
          </div>
        ) : (
          incidents.map((incident, i) => {
            const isOpen = incident.status === "open"
            return (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="flex items-start gap-3.5 px-5 py-4 no-underline transition-colors"
                style={{
                  color: "inherit",
                  borderTop: i > 0 ? "1px solid #F0EEEA" : undefined,
                }}
              >
                <div className="pt-0.5 shrink-0">
                  <span
                    className="block w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: isOpen ? "#C4453C" : "#A8A8A8",
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <span
                      className="text-[15px] font-semibold"
                      style={{ color: "#1A1A1A" }}
                    >
                      {incident.site?.name}
                    </span>
                    <span
                      className="text-[11px] font-bold uppercase px-2 py-0.5 rounded"
                      style={{
                        letterSpacing: "0.04em",
                        backgroundColor: isOpen ? "#fdecea" : "#F2F0ED",
                        color: isOpen ? "#C4453C" : "#807B74",
                      }}
                    >
                      {incident.status}
                    </span>
                  </div>
                  {incident.check?.error && (
                    <div
                      className="text-[13px] mb-1"
                      style={{ color: "#5C5C5C" }}
                    >
                      {incident.check.error}
                    </div>
                  )}
                  <div className="text-[13px]" style={{ color: "#807B74" }}>
                    <LocalIncidentRange
                      openedAt={incident.opened_at}
                      resolvedAt={incident.resolved_at}
                    />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}
