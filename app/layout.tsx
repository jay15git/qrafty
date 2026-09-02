import type { Metadata, Viewport } from "next"
import {
  Bricolage_Grotesque,
  Geist_Mono,
  Kodchasan,
  Manrope,
} from "next/font/google"

import { GlimmRootProvider } from "@/components/glimm-root-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { MotionProvider } from "@/components/motion-provider"

import "./globals.css"

const heroSupportFont = Kodchasan({
  variable: "--font-kodchasan",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

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
  title: "QRafty",
  description: "QRafty — premium branded QR codes, live refinement, and export.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      {
        url: "/icon-dark.png",
        type: "image/png",
        sizes: "32x32",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
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
      className={`${heroSupportFont.variable} ${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full cursor-default flex-col">
        <ThemeProvider>
          <GlimmRootProvider>
            <MotionProvider>{children}</MotionProvider>
          </GlimmRootProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
