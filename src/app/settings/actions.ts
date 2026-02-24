"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

const E164_REGEX = /^\+[1-9]\d{1,14}$/

export async function addContact(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const type = (formData.get("contact_type") as string) || "email"

  if (type === "sms") {
    const phone = formData.get("contact_phone") as string
    if (!phone) return
    if (!E164_REGEX.test(phone)) return
    await supabase.from("contacts").insert({ type: "sms", phone })
  } else {
    const email = formData.get("contact_email") as string
    if (!email) return
    await supabase.from("contacts").insert({ type: "email", email })
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
