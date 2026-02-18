"use client"

import { useState } from "react"
import { editSite, deleteSite } from "@/app/sites/actions"

export default function EditSiteButton({
  siteId,
  name,
  url,
}: {
  siteId: string
  name: string
  url: string
}) {
  const [isEditing, setIsEditing] = useState(false)

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center justify-center rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{
          width: "28px",
          height: "28px",
          color: "#5C5C5C",
          background: "transparent",
          border: "none",
        }}
        title="Edit site"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11.5 1.5l3 3-9 9H2.5v-3z" />
          <path d="M10 3l3 3" />
        </svg>
      </button>
    )
  }

  return (
    <div
      className="absolute inset-0 rounded z-10"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E8E4DF",
        padding: "16px 18px",
      }}
    >
      <form
        action={editSite.bind(null, siteId)}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          name="name"
          defaultValue={name}
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
          defaultValue={url}
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
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm px-3 py-1.5 rounded cursor-pointer"
            style={{
              backgroundColor: "transparent",
              color: "#5C5C5C",
              border: "1px solid #E8E4DF",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleteSite(siteId)}
            className="text-sm px-3 py-1.5 rounded cursor-pointer ml-auto"
            style={{
              backgroundColor: "transparent",
              color: "#C4453C",
              border: "1px solid #E8E4DF",
            }}
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
