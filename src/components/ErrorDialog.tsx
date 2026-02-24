"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

type ErrorDialogContextType = {
  showError: (message: string) => void
}

const ErrorDialogContext = createContext<ErrorDialogContextType | null>(null)

export function useErrorDialog() {
  const ctx = useContext(ErrorDialogContext)
  if (!ctx) throw new Error("useErrorDialog must be used within ErrorDialogProvider")
  return ctx
}

export default function ErrorDialogProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState("")

  const showError = useCallback((msg: string) => {
    setMessage(msg)
    dialogRef.current?.showModal()
  }, [])

  return (
    <ErrorDialogContext.Provider value={{ showError }}>
      {children}
      <dialog
        ref={dialogRef}
        className="rounded-lg p-0 backdrop:bg-black/40"
        style={{
          border: "1px solid #E8E4DF",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          maxWidth: "400px",
          width: "calc(100% - 48px)",
          margin: "auto",
        }}
      >
        <div style={{ padding: "24px" }}>
          <h3
            className="text-base font-bold mb-3"
            style={{ color: "#1A1A1A" }}
          >
            Error
          </h3>
          <p className="text-sm mb-4" style={{ color: "#5C5C5C" }}>
            {message}
          </p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-sm font-medium px-4 py-2 rounded cursor-pointer text-white"
            style={{ backgroundColor: "#2C2C2C" }}
          >
            OK
          </button>
        </div>
      </dialog>
    </ErrorDialogContext.Provider>
  )
}
