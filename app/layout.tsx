import type React from "react"
import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"
import "./globals.css"
import { TeamProvider } from "@/contexts/team-context"

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-vazirmatn",
})

export const metadata: Metadata = {
  title: "بازی توزیع نوشابه",
  description: "شبیه‌سازی زنجیره تأمین برای یادگیری اثر شلاق",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <head>
        <style>{`
html {
  font-family: ${vazirmatn.style.fontFamily};
  --font-sans: ${vazirmatn.style.fontFamily};
  --font-mono: ${vazirmatn.style.fontFamily};
}
        `}</style>
      </head>
      <body>
        <TeamProvider>{children}</TeamProvider>
      </body>
    </html>
  )
}
