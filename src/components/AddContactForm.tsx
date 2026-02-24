"use client"

import { useState } from "react"
import { addContact } from "@/app/settings/actions"

export default function AddContactForm() {
  const [type, setType] = useState<"email" | "sms">("email")

  return (
    <form action={addContact} className="flex gap-2">
      <input type="hidden" name="contact_type" value={type} />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "email" | "sms")}
        className="text-sm px-2 py-2 rounded"
        style={{
          border: "1px solid #E8E4DF",
          backgroundColor: "#FFFFFF",
          color: "#1A1A1A",
        }}
      >
        <option value="email">Email</option>
        <option value="sms">SMS</option>
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
          style={{
            border: "1px solid #E8E4DF",
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
          }}
        />
      ) : (
        <input
          type="tel"
          name="contact_phone"
          placeholder="+15551234567"
          required
          pattern="\+[1-9]\d{1,14}"
          title="Phone number in E.164 format (e.g. +15551234567)"
          data-1p-ignore
          autoComplete="off"
          className="flex-1 text-sm px-3 py-2 rounded outline-none transition-colors"
          style={{
            border: "1px solid #E8E4DF",
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
          }}
        />
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
