import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Contact, Invitation } from "@/lib/supabase/types"
import { deleteContact } from "./actions"
import AddContactForm from "@/components/AddContactForm"
import CanarySettings from "@/components/CanarySettings"
import { sendInvitation, revokeInvitation } from "./invite-actions"
import ActionForm from "@/components/ActionForm"
import Link from "next/link"

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at")

  const typedContacts = (contacts ?? []) as Contact[]

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .is("accepted_at", null)
    .order("created_at")

  const typedInvitations = (invitations ?? []) as Invitation[]

  const { data: canarySetting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "canary_status_code")
    .single()

  const canaryCode = canarySetting ? parseInt(canarySetting.value, 10) : 200

  return (
    <main className="max-w-[720px] mx-auto" style={{ padding: "32px 24px 64px" }}>
      <div className="mb-7">
        <Link
          href="/"
          className="text-sm no-underline"
          style={{ color: "#C4453C" }}
        >
          &larr; Back
        </Link>
      </div>

      <div
        className="rounded mb-6"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E4DF",
          padding: "28px",
        }}
      >
        <h2 className="text-xl font-bold mb-1.5" style={{ color: "#1A1A1A" }}>
          Contacts
        </h2>
        <p className="text-sm mb-5" style={{ color: "#5C5C5C" }}>
          All contacts are notified when an incident is opened.
        </p>

        <ul className="list-none mb-5">
          {typedContacts.length === 0 ? (
            <li className="py-2.5 text-sm" style={{ color: "#5C5C5C" }}>
              No contacts added yet.
            </li>
          ) : (
            typedContacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: "1px solid #F0EDEA" }}
              >
                <span className="text-[15px] flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                  <span
                    className="text-[11px] font-medium uppercase px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: contact.type === "slack" ? "#E8F0E8" : "#E8EEF4",
                      color: contact.type === "slack" ? "#2D6A2D" : "#2D4A6A",
                    }}
                  >
                    {contact.type}
                  </span>
                  {contact.type === "slack" ? (contact.label || "Slack webhook") : contact.email}
                </span>
                <ActionForm action={deleteContact.bind(null, contact.id)}>
                  <button
                    type="submit"
                    className="text-[13px] px-3 py-1 rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor: "transparent",
                      color: "#5C5C5C",
                      border: "1px solid #E8E4DF",
                    }}
                  >
                    Remove
                  </button>
                </ActionForm>
              </li>
            ))
          )}
        </ul>

        <AddContactForm />
      </div>

      <div
        className="rounded mb-6"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E4DF",
          padding: "28px",
        }}
      >
        <h2 className="text-xl font-bold mb-1.5" style={{ color: "#1A1A1A" }}>
          Invitations
        </h2>
        <p className="text-sm mb-5" style={{ color: "#5C5C5C" }}>
          Invite new administrators by email.
        </p>

        <ul className="list-none mb-5">
          {typedInvitations.length === 0 ? (
            <li className="py-2.5 text-sm" style={{ color: "#5C5C5C" }}>
              No pending invitations.
            </li>
          ) : (
            typedInvitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: "1px solid #F0EDEA" }}
              >
                <span className="text-[15px]" style={{ color: "#1A1A1A" }}>
                  {invitation.email}
                </span>
                <ActionForm action={revokeInvitation.bind(null, invitation.id)}>
                  <button
                    type="submit"
                    className="text-[13px] px-3 py-1 rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor: "transparent",
                      color: "#5C5C5C",
                      border: "1px solid #E8E4DF",
                    }}
                  >
                    Revoke
                  </button>
                </ActionForm>
              </li>
            ))
          )}
        </ul>

        <ActionForm action={sendInvitation} className="flex gap-2">
          <input
            type="email"
            name="email"
            placeholder="invite@example.com"
            required
            className="flex-1 text-sm px-3 py-2 rounded outline-none transition-colors"
            style={{
              border: "1px solid #E8E4DF",
              backgroundColor: "#FFFFFF",
              color: "#1A1A1A",
            }}
          />
          <button
            type="submit"
            className="text-sm font-medium px-4 py-2 rounded cursor-pointer text-white"
            style={{ backgroundColor: "#2C2C2C" }}
          >
            Send
          </button>
        </ActionForm>
      </div>

      <div
        className="rounded mb-6"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E4DF",
          padding: "28px",
        }}
      >
        <h2 className="text-xl font-bold mb-1.5" style={{ color: "#1A1A1A" }}>
          Canary
        </h2>
        <p className="text-sm mb-5" style={{ color: "#5C5C5C" }}>
          The <code style={{ fontSize: "13px", backgroundColor: "#F5F3F0", padding: "1px 5px", borderRadius: "3px" }}>/canary</code> endpoint
          responds with the status code below. Add it as a monitored site to test alerting end-to-end.
        </p>

        <CanarySettings currentCode={canaryCode} />
      </div>
    </main>
  )
}
