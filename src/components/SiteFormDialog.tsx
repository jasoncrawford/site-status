"use client"

import { useId, useRef, useState } from "react"
import { addSite, editSite, deleteSite } from "@/app/sites/actions"

export default function SiteFormDialog({
  mode,
  siteId,
  name,
  url,
  trigger,
}: {
  mode: "add" | "edit"
  siteId?: string
  name?: string
  url?: string
  trigger: React.ReactNode
}) {
  const id = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function open() {
    setConfirmingDelete(false)
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
    setConfirmingDelete(false)
  }

  return (
    <>
      <span onClick={open} className="contents">
        {trigger}
      </span>
      <dialog
        ref={dialogRef}
        className="rounded-lg p-0 backdrop:bg-black/40"
        style={{
          border: "1px solid #E8E4DF",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          maxWidth: "400px",
          width: "calc(100% - 48px)",
        }}
        onClick={(e) => {
          // Clicks on the backdrop hit the dialog element itself.
          // Don't close — user preference is Cancel/Escape only.
          if (e.target === dialogRef.current) {
            e.preventDefault()
          }
        }}
      >
        <div style={{ padding: "24px" }}>
          <h3
            className="text-base font-bold mb-4"
            style={{ color: "#1A1A1A" }}
          >
            {mode === "add" ? "Add site" : "Edit site"}
          </h3>
          <form
            action={async (formData) => {
              if (mode === "add") {
                await addSite(formData)
              } else {
                await editSite(siteId!, formData)
              }
              close()
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${id}-name`}
                className="text-xs font-medium"
                style={{ color: "#5C5C5C" }}
              >
                Name
              </label>
              <input
                id={`${id}-name`}
                type="text"
                name="name"
                defaultValue={name ?? ""}
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
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${id}-url`}
                className="text-xs font-medium"
                style={{ color: "#5C5C5C" }}
              >
                URL
              </label>
              <input
                id={`${id}-url`}
                type="url"
                name="url"
                defaultValue={url ?? ""}
                placeholder="https://example.com"
                required
                className="text-sm px-3 py-2 rounded outline-none"
                style={{
                  border: "1px solid #E8E4DF",
                  backgroundColor: "#FFFFFF",
                  color: "#1A1A1A",
                }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="text-sm font-medium px-4 py-2 rounded cursor-pointer text-white"
                style={{ backgroundColor: "#2C2C2C" }}
              >
                {mode === "add" ? "Add" : "Save"}
              </button>
              <button
                type="button"
                onClick={close}
                className="text-sm px-4 py-2 rounded cursor-pointer"
                style={{
                  backgroundColor: "transparent",
                  color: "#5C5C5C",
                  border: "1px solid #E8E4DF",
                }}
              >
                Cancel
              </button>
              {mode === "edit" && !confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-sm px-4 py-2 rounded cursor-pointer ml-auto"
                  style={{
                    backgroundColor: "transparent",
                    color: "#C4453C",
                    border: "1px solid #E8E4DF",
                  }}
                >
                  Delete
                </button>
              )}
              {mode === "edit" && confirmingDelete && (
                <span
                  className="ml-auto flex items-center gap-2 text-sm"
                  style={{ color: "#C4453C" }}
                >
                  Delete?
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteSite(siteId!)
                      close()
                    }}
                    className="text-sm font-medium px-3 py-1 rounded cursor-pointer text-white"
                    style={{ backgroundColor: "#C4453C" }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-sm px-3 py-1 rounded cursor-pointer"
                    style={{
                      backgroundColor: "transparent",
                      color: "#5C5C5C",
                      border: "1px solid #E8E4DF",
                    }}
                  >
                    No
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </dialog>
    </>
  )
}
