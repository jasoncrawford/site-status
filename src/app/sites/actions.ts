"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function addSite(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const name = (formData.get("name") as string)?.trim()
  const url = (formData.get("url") as string)?.trim()

  if (!name || !url) return

  const { data: maxRow } = await supabase
    .from("sites")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const position = (maxRow?.position ?? -1) + 1

  await supabase.from("sites").insert({ name, url, position })
  revalidatePath("/")
}

export async function editSite(siteId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const name = (formData.get("name") as string)?.trim()
  const url = (formData.get("url") as string)?.trim()

  if (!name || !url) return

  await supabase.from("sites").update({ name, url }).eq("id", siteId)
  revalidatePath("/")
  revalidatePath(`/sites/${siteId}`)
}

export async function deleteSite(siteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  await supabase.from("sites").delete().eq("id", siteId)
  revalidatePath("/")
}

export async function reorderSites(orderedIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("sites")
      .update({ position: i })
      .eq("id", orderedIds[i])
  }

  revalidatePath("/")
}
