"use client"

import { useState } from "react"
import { addContact } from "@/app/settings/actions"

const inputStyle = {
  border: "1px solid #E8E4DF",
  backgroundColor: "#FFFFFF",
  color: "#1A1A1A",
}

export default function AddContactForm() {
  const [type, setType] = useState<"email" | "slack">("email")

  return (
    <form action={async (formData: FormData) => {
      await addContact(formData)
      setType("email")
    }} className="flex gap-2">
      <input type="hidden" name="contact_type" value={type} />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "email" | "slack")}
        className="text-sm px-2 py-2 rounded"
        style={inputStyle}
      >
        <option value="email">Email</option>
        <option value="slack">Slack</option>
      </select>
      {type === "email" ? (
        <input
          type="email"
          name="contact_email"
          placeholder="email@example.com"
          required
          data-1p-ignore
          autoComplete="off"
          className="flex-1 text-sm px-3 py-2 rounded outline-none transition-colors"
          style={inputStyle}
        />
      ) : (
        <>
          <input
            type="text"
            name="contact_label"
            placeholder="#channel name"
            required
            data-1p-ignore
            autoComplete="off"
            className="text-sm px-3 py-2 rounded outline-none transition-colors"
            style={{ ...inputStyle, width: "140px" }}
          />
          <input
            type="url"
            name="contact_webhook_url"
            placeholder="https://hooks.slack.com/services/..."
            required
            data-1p-ignore
            autoComplete="off"
            className="flex-1 text-sm px-3 py-2 rounded outline-none transition-colors"
            style={inputStyle}
          />
        </>
      )}
      <button
        type="submit"
        className="text-sm font-medium px-4 py-2 rounded cursor-pointer text-white"
        style={{ backgroundColor: "#2C2C2C" }}
      >
        Add
      </button>
    </form>
  )
}
