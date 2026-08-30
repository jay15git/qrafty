import type { Metadata, Viewport } from "next"
import {
  Bricolage_Grotesque,
  Geist_Mono,
  Manrope,
} from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { MotionProvider } from "@/components/motion-provider"

import "./globals.css"

const displayFont = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
})

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
})

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "QR Studio",
  description: "A premium QR studio for branded codes, live refinement, and export.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1f222c" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full cursor-default flex-col">
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
