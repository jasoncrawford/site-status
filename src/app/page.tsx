import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Site, Check, Incident } from "@/lib/supabase/types"
import { formatTimeAgo, formatDuration } from "@/lib/format"
import AddSiteCard from "@/components/AddSiteCard"
import EditSiteButton from "@/components/EditSiteButton"
import RealtimeStatusPage from "@/components/RealtimeStatusPage"

export const revalidate = 0

type SiteWithLastCheck = Site & { lastCheck: Check | null }
type IncidentWithSite = Incident & { site: Site; check: Check }

async function getStatusData() {
  const supabase = await createClient()

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("name")

  const { data: openIncidents } = await supabase
    .from("incidents")
    .select("*, site:sites(*), check:checks(*)")
    .eq("status", "open")
    .order("opened_at", { ascending: false })

  const sitesWithChecks: SiteWithLastCheck[] = []
  for (const site of sites ?? []) {
    const { data: checks } = await supabase
      .from("checks")
      .select("*")
      .eq("site_id", site.id)
      .order("checked_at", { ascending: false })
      .limit(1)

    sitesWithChecks.push({
      ...site,
      lastCheck: checks?.[0] ?? null,
    })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return {
    sites: sitesWithChecks,
    incidents: (openIncidents ?? []) as IncidentWithSite[],
    isAdmin: !!user,
  }
}

export default async function StatusPage() {
  const { sites, incidents, isAdmin } = await getStatusData()

  return (
    <main
      className="max-w-[960px] mx-auto"
      style={{ padding: "36px 24px 80px" }}
    >
      <RealtimeStatusPage />
      {incidents.length > 0 && (
        <section>
          <h2
            className="text-xl font-bold mb-4"
            style={{ color: "#1A1A1A" }}
          >
            Open Incidents
          </h2>
          <div className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidents/${incident.id}`}
                className="block no-underline"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E4DF",
                  borderLeft: "3px solid #C4453C",
                  borderRadius: "4px",
                  padding: "16px 20px",
                  color: "inherit",
                }}
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: "#1A1A1A" }}
                  >
                    {incident.site?.name}
                  </span>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: "#C4453C" }}
                  >
                    Down for {formatDuration(incident.opened_at)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                  {incident.check?.error && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        color: "#5C5C5C",
                        backgroundColor: "#F3F0EC",
                      }}
                    >
                      {incident.check.error}
                    </span>
                  )}
                  <span className="text-[13px]" style={{ color: "#5C5C5C" }}>
                    {incident.site?.url}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: incidents.length > 0 ? "44px" : "0" }}>
        <h2
          className="text-xl font-bold mb-4"
          style={{ color: "#1A1A1A" }}
        >
          Sites
        </h2>

        {sites.length === 0 && !isAdmin ? (
          <p className="text-sm" style={{ color: "#5C5C5C" }}>
            No sites are being monitored yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className="group relative"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E4DF",
                  borderRadius: "4px",
                  padding: "16px 18px",
                }}
              >
                <Link
                  href={`/sites/${site.id}`}
                  className="block no-underline"
                  style={{ color: "inherit" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            site.lastCheck?.status === "failure"
                              ? "#C4453C"
                              : "#5A8A5A",
                        }}
                      />
                      <span
                        className="text-sm font-bold truncate"
                        style={{ color: "#1A1A1A" }}
                      >
                        {site.name}
                      </span>
                    </div>
                  </div>
                  <div
                    className="mt-1.5 text-xs truncate"
                    style={{ color: "#5C5C5C" }}
                  >
                    {site.url}
                  </div>
                  <div
                    className="mt-2 text-[11px]"
                    style={{ color: "#8A8A8A", letterSpacing: "0.01em" }}
                  >
                    {site.lastCheck
                      ? `Checked ${formatTimeAgo(site.lastCheck.checked_at)}`
                      : "No checks yet"}
                  </div>
                </Link>
                {isAdmin && (
                  <div className="absolute top-3 right-3">
                    <EditSiteButton
                      siteId={site.id}
                      name={site.name}
                      url={site.url}
                    />
                  </div>
                )}
              </div>
            ))}
            {isAdmin && <AddSiteCard />}
          </div>
        )}
      </section>
    </main>
  )
}
