"use server"

import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"

export async function acceptInvitation(token: string, formData: FormData) {
  const password = (formData.get("password") as string)?.trim()
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const supabase = createAdminClient()

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single()

  if (!invitation) {
    return { error: "This invitation is invalid or has already been used" }
  }

  const { error: createError } = await supabase.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
  })

  if (createError) {
    if (createError.message.includes("already been registered")) {
      return { error: "This email is already registered" }
    }
    return { error: "Failed to create account" }
  }

  await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id)

  redirect("/login")
}
