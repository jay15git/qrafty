"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-6 py-16 text-center text-foreground">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          New QR
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Design QR codes that look intentional.
        </h1>
        <p className="mx-auto max-w-lg text-base text-muted-foreground">
          Open the desktop studio to edit layout, styling, motion, and export.
        </p>
      </div>
      <Link
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        href="/desktop"
      >
        Open studio
      </Link>
    </main>
  )
}
