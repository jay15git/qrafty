import { describe, expect, it } from "vitest"

import {
  getContentTypeLabel,
  normalizeContentTypeForPicker,
  PICKER_QR_INPUT_TYPES,
} from "@/features/qr-code/content/input-options"

describe("picker content types", () => {
  it("exposes structured types plus the full platform catalog", () => {
    expect(PICKER_QR_INPUT_TYPES).toContain("link")
    expect(PICKER_QR_INPUT_TYPES).toContain("instagram")
    expect(PICKER_QR_INPUT_TYPES).toContain("spotify")
    expect(PICKER_QR_INPUT_TYPES).toContain("app-store")
    expect(PICKER_QR_INPUT_TYPES).toContain("github")
    expect(PICKER_QR_INPUT_TYPES.length).toBeGreaterThan(40)
  })

  it("normalizes legacy aliases to link or resolved picker types", () => {
    expect(normalizeContentTypeForPicker("pdf")).toBe("link")
    expect(normalizeContentTypeForPicker("form")).toBe("google-forms")
    expect(normalizeContentTypeForPicker("booking-link")).toBe("calendly")
    expect(normalizeContentTypeForPicker("payment-link")).toBe("stripe")
    expect(normalizeContentTypeForPicker("instagram")).toBe("instagram")
    expect(normalizeContentTypeForPicker("telegram-username")).toBe("telegram")
    expect(normalizeContentTypeForPicker("auto")).toBe("text")
    expect(normalizeContentTypeForPicker("app-download")).toBe("app-store")
    expect(normalizeContentTypeForPicker("wifi")).toBe("wifi")
  })

  it("labels platform and legacy types", () => {
    expect(getContentTypeLabel("pdf")).toBe("PDF")
    expect(getContentTypeLabel("instagram")).toBe("Instagram")
    expect(getContentTypeLabel("auto")).toBe("Text")
    expect(getContentTypeLabel("link")).toBe("Link")
  })
})
