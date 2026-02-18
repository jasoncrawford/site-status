"use client"

import { useState, useActionState } from "react"
import { acceptInvitation } from "./actions"
import Link from "next/link"

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const [token, setToken] = useState<string | null>(null)

  // Unwrap params
  if (!token) {
    params.then((p) => setToken(p.token))
    return null
  }

  return <AcceptInviteForm token={token} />
}

function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await acceptInvitation(token, formData)
      return result ?? null
    },
    null
  )

  return (
    <main
      className="max-w-[400px] mx-auto"
      style={{ padding: "80px 24px" }}
    >
      <div
        className="rounded"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E4DF",
          padding: "32px",
        }}
      >
        <h1
          className="text-xl font-bold mb-1.5"
          style={{ color: "#1A1A1A" }}
        >
          Accept Invitation
        </h1>
        <p className="text-sm mb-5" style={{ color: "#5C5C5C" }}>
          Set a password to create your account.
        </p>

        {state?.error && (
          <div
            className="text-sm rounded mb-4"
            style={{
              backgroundColor: "#FDF3F3",
              color: "#C4453C",
              padding: "10px 14px",
              border: "1px solid #F5D5D3",
            }}
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-3">
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            required
            minLength={8}
            className="text-sm px-3 py-2 rounded outline-none"
            style={{
              border: "1px solid #E8E4DF",
              backgroundColor: "#FFFFFF",
              color: "#1A1A1A",
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            className="text-sm font-medium px-4 py-2 rounded cursor-pointer text-white"
            style={{
              backgroundColor: "#2C2C2C",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm no-underline"
            style={{ color: "#C4453C" }}
          >
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </main>
  )
}
