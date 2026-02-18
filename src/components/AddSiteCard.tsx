"use client"

import { useState } from "react"
import { addSite } from "@/app/sites/actions"

export default function AddSiteCard() {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center flex-col gap-1.5 rounded cursor-pointer"
        style={{
          background: "transparent",
          border: "1.5px dashed #D4CFC9",
          padding: "24px 18px",
          color: "#8A8A8A",
          minHeight: "108px",
          transition: "border-color 0.15s, color 0.15s",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
        <span className="text-[13px] font-medium">Add site</span>
      </button>
    )
  }

  return (
    <div
      className="rounded"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E8E4DF",
        padding: "16px 18px",
      }}
    >
      <form
        action={async (formData) => {
          await addSite(formData)
          setIsOpen(false)
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          name="name"
          placeholder="Site name"
          required
          autoFocus
          className="text-sm px-3 py-2 rounded outline-none"
          style={{
            border: "1px solid #E8E4DF",
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
          }}
        />
        <input
          type="url"
          name="url"
          placeholder="https://example.com"
          required
          className="text-sm px-3 py-2 rounded outline-none"
          style={{
            border: "1px solid #E8E4DF",
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
          }}
        />
        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            className="text-sm font-medium px-3 py-1.5 rounded cursor-pointer text-white"
            style={{ backgroundColor: "#2C2C2C" }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-sm px-3 py-1.5 rounded cursor-pointer"
            style={{
              backgroundColor: "transparent",
              color: "#5C5C5C",
              border: "1px solid #E8E4DF",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
