import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Site, Check, Incident } from "@/lib/supabase/types"
import { LocalIncidentRange } from "@/components/LocalTime"
import SiteFormDialog from "@/components/SiteFormDialog"
import CheckLogTable from "@/components/CheckLogTable"

export const revalidate = 0

async function getSiteData(id: string) {
  const supabase = await createClient()

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .single()

  if (!site) return null

  const { data: incidents } = await supabase
    .from("incidents")
    .select("*, check:checks(*)")
    .eq("site_id", id)
    .order("opened_at", { ascending: false })

  const { data: checks } = await supabase
    .from("checks")
    .select("*")
    .eq("site_id", id)
    .order("checked_at", { ascending: false })
    .limit(50)

  return {
    site: site as Site,
    incidents: (incidents ?? []) as (Incident & { check: Check })[],
    checks: (checks ?? []) as Check[],
  }
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getSiteData(id)
  if (!data) notFound()

  const { site, incidents, checks } = data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="max-w-[820px] mx-auto" style={{ padding: "32px 24px 80px" }}>
      <div className="mb-7">
        <Link
          href="/"
          className="text-sm no-underline"
          style={{ color: "#C4453C" }}
        >
          &larr; All Sites
        </Link>
      </div>

      <div className="flex items-start justify-between gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <h1
            className="text-3xl font-bold mb-1.5"
            style={{ color: "#1A1A1A", letterSpacing: "-0.01em" }}
          >
            {site.name}
          </h1>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm break-all no-underline hover:underline"
            style={{ color: "#5C5C5C" }}
          >
            {site.url}
          </a>
        </div>

        {user && (
          <div className="flex items-center gap-2.5 shrink-0 pt-1.5">
            <SiteFormDialog
              mode="edit"
              siteId={site.id}
              name={site.name}
              url={site.url}
              trigger={
                <button
                  className="text-sm font-medium px-4 py-2 rounded cursor-pointer"
                  style={{
                    backgroundColor: "#2C2C2C",
                    color: "#FFFFFF",
                  }}
                >
                  Edit
                </button>
              }
            />
          </div>
        )}
      </div>

      <section className="mb-10">
        <h2
          className="text-[22px] font-bold mb-4"
          style={{ color: "#1A1A1A", letterSpacing: "-0.01em" }}
        >
          Incidents
        </h2>
        <div
          className="rounded overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E4DF" }}
        >
          {incidents.length === 0 ? (
            <div className="px-5 py-4 text-sm" style={{ color: "#5C5C5C" }}>
              No incidents recorded.
            </div>
          ) : (
            incidents.slice(0, 3).map((incident, i) => {
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
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-[15px] font-semibold" style={{ color: "#1A1A1A" }}>
                        {incident.check?.error ?? "Unknown error"}
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
                    <div className="text-[13px]" style={{ color: "#5C5C5C" }}>
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
        {incidents.length > 3 && (
          <div style={{ marginTop: "12px" }}>
            <Link
              href={`/sites/${site.id}/incidents`}
              className="text-sm no-underline"
              style={{ color: "#C4453C" }}
            >
              View all incidents &rarr;
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2
          className="text-[22px] font-bold mb-4"
          style={{ color: "#1A1A1A", letterSpacing: "-0.01em" }}
        >
          Check Log
        </h2>
        <CheckLogTable checks={checks} />
      </section>
    </main>
  )
}
