"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function addContact(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const email = formData.get("email") as string
  if (!email) return

  await supabase.from("contacts").insert({ email })
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
