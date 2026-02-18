import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Status",
  description: "Uptime monitoring for Roots of Progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
