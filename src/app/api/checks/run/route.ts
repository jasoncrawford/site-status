import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSite, isSoftFailure } from '@/lib/checker'
import { sendIncidentAlert } from '@/lib/notifications'

export const maxDuration = 60

async function handleCheckRun(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')

  if (sitesError || !sites) {
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
  }

  if (sites.length === 0) {
    return NextResponse.json({ message: 'No sites to check', checks: 0, incidents: 0 })
  }

  const results = await Promise.allSettled(
    sites.map(async (site) => {
      const result = await checkSite(site.url)
      return { site, ...result }
    })
  )

  let newIncidents = 0

  for (const result of results) {
    if (result.status === 'rejected') continue

    const { site, status, statusCode, error } = result.value

    const { data: check } = await supabase
      .from('checks')
      .insert({
        site_id: site.id,
        status,
        status_code: statusCode,
        error,
      })
      .select()
      .single()

    if (status === 'failure' && check) {
      const { data: openIncident } = await supabase
        .from('incidents')
        .select('id')
        .eq('site_id', site.id)
        .eq('status', 'open')
        .limit(1)
        .single()

      if (!openIncident) {
        const soft = isSoftFailure(statusCode, error)
        let shouldCreateIncident = !soft // Hard failures always create incidents

        if (soft) {
          // Soft failures only create incidents when there are 3+ within the last hour
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
          const { data: recentFailures } = await supabase
            .from('checks')
            .select('status_code, error')
            .eq('site_id', site.id)
            .eq('status', 'failure')
            .gte('checked_at', oneHourAgo)

          const softFailureCount = (recentFailures ?? []).filter(
            (c: { status_code: number | null; error: string | null }) =>
              isSoftFailure(c.status_code, c.error)
          ).length
          shouldCreateIncident = softFailureCount >= 3
        }

        if (shouldCreateIncident) {
          const { data: incident } = await supabase
            .from('incidents')
            .insert({
              site_id: site.id,
              check_id: check.id,
              status: 'open',
            })
            .select('id')
            .single()
          newIncidents++

          if (incident) {
            const { data: contacts } = await supabase
              .from('contacts')
              .select('email')

            await sendIncidentAlert({
              siteName: site.name,
              siteUrl: site.url,
              error,
              incidentId: incident.id,
              contactEmails: (contacts ?? []).map((c: { email: string }) => c.email),
            })
          }
        }
      }
    }
  }

  return NextResponse.json({
    message: 'Checks complete',
    checks: results.length,
    incidents: newIncidents,
  })
}

export { handleCheckRun as GET, handleCheckRun as POST }

export function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}
