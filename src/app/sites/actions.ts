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

  if (!name || !url) return { error: "Name and URL are both required." }

  const { data: maxRow } = await supabase
    .from("sites")
    .select("position")
    .is("archived_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const position = (maxRow?.position ?? -1) + 1

  const { error } = await supabase.from("sites").insert({ name, url, position })
  if (error) return { error: `Failed to add site: ${error.message}` }
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

  if (!name || !url) return { error: "Name and URL are both required." }

  const { error } = await supabase.from("sites").update({ name, url }).eq("id", siteId)
  if (error) return { error: `Failed to update site: ${error.message}` }
  revalidatePath("/")
  revalidatePath(`/sites/${siteId}`)
}

export async function archiveSite(siteId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { error } = await supabase
    .from("sites")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", siteId)
  if (error) return { error: `Failed to archive site: ${error.message}` }
  revalidatePath("/")
}

export async function reorderSites(orderedIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("sites")
      .update({ position: i })
      .eq("id", orderedIds[i])
    if (error) return { error: `Failed to reorder sites: ${error.message}` }
  }

  revalidatePath("/")
}
