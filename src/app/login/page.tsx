"use client"

import { useState } from "react"
import { login } from "./actions"
import Link from "next/link"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#FAF8F5" }}
    >
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#1A1A1A" }}
          >
            Roots of Progress
          </div>
          <div
            className="text-sm mt-1"
            style={{ color: "#5C5C5C", letterSpacing: "0.02em" }}
          >
            Site Status
          </div>
        </div>

        <div
          className="rounded p-8"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8E4DF",
          }}
        >
          <h1
            className="text-xl font-bold mb-6"
            style={{ color: "#1A1A1A" }}
          >
            Log in
          </h1>

          {error && (
            <div
              className="text-sm mb-4 p-3 rounded"
              style={{
                color: "#C4453C",
                backgroundColor: "rgba(196, 69, 60, 0.06)",
                border: "1px solid rgba(196, 69, 60, 0.15)",
              }}
            >
              {error}
            </div>
          )}

          <form action={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#1A1A1A" }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 text-[15px] rounded outline-none transition-all"
                style={{
                  color: "#1A1A1A",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E4DF",
                }}
              />
            </div>

            <div className="mb-7">
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#1A1A1A" }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                className="w-full px-3 py-2.5 text-[15px] rounded outline-none transition-all"
                style={{
                  color: "#1A1A1A",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8E4DF",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 text-[15px] font-semibold text-white rounded cursor-pointer transition-colors disabled:opacity-60"
              style={{ backgroundColor: pending ? "#5C5C5C" : "#2C2C2C" }}
            >
              {pending ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="block text-center mt-6 text-sm no-underline transition-colors"
          style={{ color: "#C4453C" }}
        >
          &larr; Back to status page
        </Link>
      </div>
    </div>
  )
}
