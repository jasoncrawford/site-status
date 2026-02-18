import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Contact } from "@/lib/supabase/types"
import { addContact, deleteContact } from "./actions"
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
          All contacts are notified by email when an incident is opened.
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
                <span className="text-[15px]" style={{ color: "#1A1A1A" }}>
                  {contact.email}
                </span>
                <form action={deleteContact.bind(null, contact.id)}>
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
                </form>
              </li>
            ))
          )}
        </ul>

        <form action={addContact} className="flex gap-2">
          <input
            type="email"
            name="email"
            placeholder="email@example.com"
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
            Add
          </button>
        </form>
      </div>
    </main>
  )
}
