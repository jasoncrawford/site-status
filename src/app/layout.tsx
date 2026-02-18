import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "Site Status",
  description: "Uptime monitoring for Roots of Progress",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#FAF8F5" }}>
        <Header />
        {children}
      </body>
    </html>
  )
}
