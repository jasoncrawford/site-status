import { Resend } from "resend"

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

type IncidentAlertParams = {
  siteName: string
  siteUrl: string
  error: string | null
  incidentId: string
  contactEmails: string[]
}

export async function sendIncidentAlert({
  siteName,
  siteUrl,
  error,
  incidentId,
  contactEmails,
}: IncidentAlertParams) {
  if (contactEmails.length === 0) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://status.rootsofprogress.org"
  const incidentLink = `${appUrl}/incidents/${incidentId}`

  const subject = `[Down] ${siteName} is not responding`
  const html = `
    <h2>${siteName} is down</h2>
    <p><strong>URL:</strong> ${siteUrl}</p>
    ${error ? `<p><strong>Error:</strong> ${error}</p>` : ""}
    <p><a href="${incidentLink}">View incident details</a></p>
  `.trim()

  const fromAddress = process.env.RESEND_FROM_EMAIL || "alerts@status.rootsofprogress.org"

  try {
    await getResend().emails.send({
      from: fromAddress,
      to: contactEmails,
      subject,
      html,
    })
  } catch (err) {
    console.error("Failed to send incident alert email:", err)
  }
}
