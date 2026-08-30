import { describe, expect, it } from "vitest"

import { parseDesktopTheme } from "@/features/desktop-shell/model/desktop-theme"

describe("parseDesktopTheme", () => {
  it("accepts light and defaults everything else to dark", () => {
    expect(parseDesktopTheme("light")).toBe("light")
    expect(parseDesktopTheme("dark")).toBe("dark")
    expect(parseDesktopTheme(undefined)).toBe("dark")
    expect(parseDesktopTheme(null)).toBe("dark")
    expect(parseDesktopTheme("system")).toBe("dark")
  })
})
