"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendInvitation(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const email = (formData.get("email") as string)?.trim()
  if (!email) return

  const token = randomBytes(32).toString("hex")

  const { error } = await supabase.from("invitations").insert({
    email,
    invited_by: user.id,
    token,
  })

  if (error) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://status.rootsofprogress.org"
  const inviteLink = `${appUrl}/invite/${token}`
  const fromAddress = process.env.RESEND_FROM_EMAIL || "alerts@status.rootsofprogress.org"

  try {
    await getResend().emails.send({
      from: fromAddress,
      to: [email],
      subject: "You've been invited to Site Status",
      html: `
        <h2>You've been invited</h2>
        <p>You've been invited to join Site Status as an administrator.</p>
        <p><a href="${inviteLink}">Click here to set your password and create your account</a></p>
      `.trim(),
    })
  } catch (err) {
    console.error("Failed to send invitation email:", err)
  }

  revalidatePath("/settings")
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  await supabase.from("invitations").delete().eq("id", invitationId)
  revalidatePath("/settings")
}
