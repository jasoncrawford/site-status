"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function resolveIncident(incidentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase
    .from("incidents")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", incidentId)

  if (error) return { error: `Failed to resolve incident: ${error.message}` }

  revalidatePath(`/incidents/${incidentId}`)
  revalidatePath("/")
}
