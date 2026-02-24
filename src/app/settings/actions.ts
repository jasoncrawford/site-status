"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const SLACK_WEBHOOK_REGEX = /^https:\/\/hooks\.slack\.com\/services\/.+$/

export async function addContact(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const type = (formData.get("contact_type") as string) || "email"

  if (type === "slack") {
    const webhookUrl = formData.get("contact_webhook_url") as string
    const label = formData.get("contact_label") as string
    if (!webhookUrl || !label) return
    if (!SLACK_WEBHOOK_REGEX.test(webhookUrl)) return
    const { error } = await supabase.from("contacts").insert({ type: "slack", webhook_url: webhookUrl, label })
    if (error) console.error("Failed to insert Slack contact:", error)
  } else {
    const email = formData.get("contact_email") as string
    if (!email) return
    const { error } = await supabase.from("contacts").insert({ type: "email", email })
    if (error) console.error("Failed to insert email contact:", error)
  }

  revalidatePath("/settings")
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  await supabase.from("contacts").delete().eq("id", contactId)
  revalidatePath("/settings")
}

const VALID_CANARY_CODES = [200, 301, 302, 400, 401, 403, 404, 408, 500, 502, 503, 504]

export async function updateCanaryStatusCode(code: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  if (!VALID_CANARY_CODES.includes(code)) return

  await supabase
    .from("settings")
    .upsert({ key: "canary_status_code", value: String(code), updated_at: new Date().toISOString() })

  revalidatePath("/settings")
}
