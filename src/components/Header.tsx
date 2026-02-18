import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/login/actions"

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "#FAF8F5",
        borderBottom: "1px solid #E8E4DF",
      }}
    >
      <div className="max-w-[960px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span
            className="text-[17px] font-bold"
            style={{ color: "#6B806B", letterSpacing: "-0.01em" }}
          >
            Roots of Progress
          </span>
          <span
            className="w-px h-4 self-center"
            style={{ backgroundColor: "#D4CFC9" }}
          />
          <span
            className="text-[13px] font-medium"
            style={{ color: "#5C5C5C", letterSpacing: "0.02em" }}
          >
            Site Status
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          {user ? (
            <>
              <Link
                href="/settings"
                className="text-[13px] no-underline transition-colors"
                style={{ color: "#5C5C5C" }}
              >
                Settings
              </Link>
              <span
                className="w-px h-3.5"
                style={{ backgroundColor: "#D4CFC9" }}
              />
              <form action={logout}>
                <button
                  type="submit"
                  className="text-[13px] bg-transparent border-none cursor-pointer transition-colors p-0"
                  style={{ color: "#5C5C5C" }}
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-[13px] no-underline transition-colors"
              style={{ color: "#5C5C5C" }}
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
