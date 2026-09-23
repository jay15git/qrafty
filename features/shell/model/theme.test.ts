import { describe, expect, it } from "vitest"

import { parseTheme } from "@/features/shell/model/theme"

describe("parseTheme", () => {
  it("accepts light and defaults everything else to dark", () => {
    expect(parseTheme("light")).toBe("light")
    expect(parseTheme("dark")).toBe("dark")
    expect(parseTheme(undefined)).toBe("dark")
    expect(parseTheme(null)).toBe("dark")
    expect(parseTheme("system")).toBe("dark")
  })
})
