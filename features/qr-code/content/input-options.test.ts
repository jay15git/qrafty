import { describe, expect, it } from "vitest"

import {
  getContentTypeLabel,
  normalizeContentTypeForPicker,
  PICKER_QR_INPUT_TYPES,
} from "@/features/qr-code/content/input-options"

describe("picker content types", () => {
  it("exposes only structured and link types in the picker", () => {
    expect(PICKER_QR_INPUT_TYPES).toEqual([
      "link",
      "text",
      "phone",
      "email",
      "sms",
      "wifi",
      "vcard",
      "whatsapp-chat",
      "telegram-username",
      "map-location",
      "event",
      "coupon",
      "upi",
      "crypto",
    ])
  })

  it("normalizes url-only aliases to link and legacy auto to text", () => {
    expect(normalizeContentTypeForPicker("pdf")).toBe("link")
    expect(normalizeContentTypeForPicker("instagram")).toBe("link")
    expect(normalizeContentTypeForPicker("menu")).toBe("link")
    expect(normalizeContentTypeForPicker("auto")).toBe("text")
    expect(normalizeContentTypeForPicker("wifi")).toBe("wifi")
  })

  it("labels aliases for picker display", () => {
    expect(getContentTypeLabel("pdf")).toBe("Link")
    expect(getContentTypeLabel("instagram")).toBe("Link")
    expect(getContentTypeLabel("auto")).toBe("Text")
    expect(getContentTypeLabel("link")).toBe("Link")
  })
})
