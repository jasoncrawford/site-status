import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Incident, Site, Check } from "@/lib/supabase/types"
import CheckLogTable from "@/components/CheckLogTable"
import { LocalDateTime } from "@/components/LocalTime"
import { resolveIncident } from "./actions"

export const revalidate = 0

type IncidentWithRelations = Incident & { site: Site; check: Check }

async function getIncidentData(id: string) {
  const supabase = await createClient()

  const { data: incident } = await supabase
    .from("incidents")
    .select("*, site:sites(*), check:checks(*)")
    .eq("id", id)
    .single()

  if (!incident) return null

  const typedIncident = incident as IncidentWithRelations

  let checksQuery = supabase
    .from("checks")
    .select("*")
    .eq("site_id", typedIncident.site_id)
    .gte("checked_at", typedIncident.check.checked_at)
    .order("checked_at", { ascending: false })

  if (typedIncident.resolved_at) {
    checksQuery = checksQuery.lte("checked_at", typedIncident.resolved_at)
  }

  const { data: checks } = await checksQuery

  return {
    incident: typedIncident,
    checks: (checks ?? []) as Check[],
  }
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getIncidentData(id)
  if (!data) notFound()

  const { incident, checks } = data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isOpen = incident.status === "open"

  return (
    <main className="max-w-[720px] mx-auto" style={{ padding: "32px 24px 64px" }}>
      <div className="mb-7">
        <Link
          href={`/sites/${incident.site_id}`}
          className="text-sm no-underline"
          style={{ color: "#C4453C" }}
        >
          &larr; {incident.site?.name}
        </Link>
      </div>

      <div
        className="rounded mb-6"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E4DF",
          padding: "28px 28px 24px",
        }}
      >
        <div className="flex items-center gap-3 mb-1.5">
          {isOpen && (
            <span
              className="inline-flex items-center text-xs font-semibold uppercase text-white px-2.5 py-0.5 rounded"
              style={{
                backgroundColor: "#C4453C",
                letterSpacing: "0.03em",
              }}
            >
              Open
            </span>
          )}
          {!isOpen && (
            <span
              className="inline-flex items-center text-xs font-semibold uppercase px-2.5 py-0.5 rounded"
              style={{
                backgroundColor: "#F2F0ED",
                color: "#807B74",
                letterSpacing: "0.03em",
              }}
            >
              Resolved
            </span>
          )}
          <h1
            className="text-2xl font-bold"
            style={{ color: "#1A1A1A", lineHeight: 1.25 }}
          >
            Incident on {incident.site?.name}
          </h1>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="text-sm flex items-center gap-1.5" style={{ color: "#5C5C5C" }}>
            <span>
              Opened <LocalDateTime dateString={incident.opened_at} />
            </span>
          </div>
          {incident.resolved_at && (
            <div className="text-sm" style={{ color: "#5C5C5C" }}>
              Resolved <LocalDateTime dateString={incident.resolved_at} />
            </div>
          )}
          <div className="text-sm" style={{ color: "#5C5C5C" }}>
            <a
              href={incident.site?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:underline"
              style={{ color: "#5C5C5C" }}
            >
              {incident.site?.url}
            </a>
          </div>
          <div className="text-sm flex items-center gap-1.5" style={{ color: "#5C5C5C" }}>
            <span>Triggered by:</span>
            <span
              className="text-[13px] font-medium px-2 py-0.5 rounded"
              style={{
                fontFamily: '"SF Mono", SFMono-Regular, Consolas, monospace',
                backgroundColor: "#F5F0EB",
                color: "#C4453C",
                border: "1px solid #E8E4DF",
              }}
            >
              {incident.check?.error ?? "Unknown"}
            </span>
          </div>
        </div>

        {isOpen && user && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid #F0ECE8" }}>
            <form action={resolveIncident.bind(null, incident.id)}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded cursor-pointer transition-colors"
                style={{ backgroundColor: "#2DA44E" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Resolve
              </button>
            </form>
          </div>
        )}
      </div>

      <section>
        <h2
          className="text-[22px] font-bold mb-4"
          style={{ color: "#1A1A1A", letterSpacing: "-0.01em" }}
        >
          Checks During Incident
        </h2>
        <CheckLogTable checks={checks} triggeringCheckId={incident.check_id} />
      </section>
    </main>
  )
}
