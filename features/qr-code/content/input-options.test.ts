import { describe, expect, it } from "vitest"

import {
  getContentTypeLabel,
  normalizeContentTypeForPicker,
  PICKER_QR_INPUT_TYPES,
} from "@/features/qr-code/content/input-options"

describe("picker content types", () => {
  it("exposes only lean structured picker types", () => {
    expect(PICKER_QR_INPUT_TYPES).toEqual([
      "link",
      "text",
      "phone",
      "email",
      "sms",
      "wifi",
      "vcard",
      "whatsapp",
      "map-location",
      "event",
      "coupon",
      "upi",
      "crypto",
    ])
    expect(PICKER_QR_INPUT_TYPES).not.toContain("instagram")
    expect(PICKER_QR_INPUT_TYPES).not.toContain("spotify")
  })

  it("normalizes legacy aliases and platform types to link or picker types", () => {
    expect(normalizeContentTypeForPicker("pdf")).toBe("link")
    expect(normalizeContentTypeForPicker("form")).toBe("link")
    expect(normalizeContentTypeForPicker("booking-link")).toBe("link")
    expect(normalizeContentTypeForPicker("payment-link")).toBe("link")
    expect(normalizeContentTypeForPicker("instagram")).toBe("link")
    expect(normalizeContentTypeForPicker("telegram-username")).toBe("link")
    expect(normalizeContentTypeForPicker("auto")).toBe("text")
    expect(normalizeContentTypeForPicker("app-download")).toBe("link")
    expect(normalizeContentTypeForPicker("wifi")).toBe("wifi")
    expect(normalizeContentTypeForPicker("whatsapp")).toBe("whatsapp")
  })

  it("labels platform and legacy types", () => {
    expect(getContentTypeLabel("pdf")).toBe("PDF")
    expect(getContentTypeLabel("instagram")).toBe("Instagram")
    expect(getContentTypeLabel("auto")).toBe("Text")
    expect(getContentTypeLabel("link")).toBe("Link")
  })
})
