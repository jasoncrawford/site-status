import { Resend } from "resend"
import twilio from "twilio"

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

let _twilioClient: twilio.Twilio | null = null
function getTwilioClient() {
  if (!_twilioClient) {
    _twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }
  return _twilioClient
}

type IncidentEmailParams = {
  siteName: string
  siteUrl: string
  error: string | null
  incidentId: string
  contactEmails: string[]
}

export async function sendIncidentEmail({
  siteName,
  siteUrl,
  error,
  incidentId,
  contactEmails,
}: IncidentEmailParams) {
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

type IncidentSmsParams = {
  siteName: string
  incidentId: string
  contactPhones: string[]
}

export async function sendIncidentSms({
  siteName,
  incidentId,
  contactPhones,
}: IncidentSmsParams) {
  if (contactPhones.length === 0) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://status.rootsofprogress.org"
  const incidentLink = `${appUrl}/incidents/${incidentId}`
  const body = `[Down] ${siteName} is not responding. ${incidentLink}`
  const from = process.env.TWILIO_FROM_NUMBER

  for (const to of contactPhones) {
    try {
      await getTwilioClient().messages.create({ body, from, to })
    } catch (err) {
      console.error(`Failed to send incident SMS to ${to}:`, err)
    }
  }
}

// Backward-compatible wrapper
type IncidentAlertParams = {
  siteName: string
  siteUrl: string
  error: string | null
  incidentId: string
  contactEmails: string[]
}

export async function sendIncidentAlert(params: IncidentAlertParams) {
  return sendIncidentEmail(params)
}
