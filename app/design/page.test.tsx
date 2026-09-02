import { readFileSync } from "node:fs"
import { isValidElement } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}))

vi.mock("@/features/desktop-shell/components/DesktopPageClient", () => ({
  DesktopPageClient: ({ fontClassName }: { fontClassName?: string }) => (
    <div data-font-class-name={fontClassName} data-testid="desktop-page-client" />
  ),
}))

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "mock-satoshi-font",
  }),
}))

import { DesktopPageClient } from "@/features/desktop-shell/components/DesktopPageClient"
import DesktopPage, { metadata } from "./page"

describe("desktop page", () => {
  it("exposes metadata for the design workspace", () => {
    expect(metadata.title).toBe("Design QR")
    expect(metadata.description).toContain("floating toolbar")
  })

  it("renders the desktop page client inside the route shell", async () => {
    const page = await DesktopPage()

    expect(isValidElement(page)).toBe(true)
    expect(page.type).toBe("main")
    expect(page.props.className).toContain("mock-satoshi-font")
    expect(page.props.className).toContain("h-dvh")
    expect(page.props["data-slot"]).toBe("desktop-page")

    const suspense = page.props.children

    expect(isValidElement(suspense)).toBe(true)
    expect(suspense.type).toBe(Symbol.for("react.suspense"))

    const client = suspense.props.children

    expect(isValidElement(client)).toBe(true)
    expect(client.type).toBe(DesktopPageClient)
    expect(client.props.fontClassName).toBe("mock-satoshi-font")
    expect(client.props.initialTheme).toBe("dark")
  })

  it("keeps portaled appearance popovers in sync with desktop light mode", () => {
    const workspaceSource = readFileSync(
      "features/desktop-shell/components/desktop-workspace-styles.tsx",
      "utf8",
    )

    expect(workspaceSource).toContain(
      'body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot^="desktop-appearance-"][data-slot$="-popover"]',
    )
    expect(workspaceSource).toContain("rgba(255, 255, 255, 0.86)")
    expect(workspaceSource).toContain('input[type="number"]')
  })
})
