import { describe, expect, it } from "vitest"

import { getContentFieldDefinitions } from "@/features/qr-code/content/content-field-definitions"
import {
  getDefaultStaticQrValues,
  validateStaticQrContent,
} from "@/features/qr-code/content/static-payload"

const STRUCTURED_TYPES = [
  "link",
  "text",
  "phone",
  "email",
  "sms",
  "wifi",
  "vcard",
  "event",
  "coupon",
  "upi",
  "crypto",
] as const

describe("content-field-definitions", () => {
  it.each(STRUCTURED_TYPES)("uses labels for every text field in %s", (type) => {
    const values = getDefaultStaticQrValues(type)
    const validation = validateStaticQrContent(type, values)
    const fields = getContentFieldDefinitions(type, values, validation)

    for (const field of fields) {
      if (field.type === "text" || field.type === "textarea") {
        expect(field.label.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it("maps structured essentials to expected labels", () => {
    const values = getDefaultStaticQrValues("link")
    const validation = validateStaticQrContent("link", values)
    const fields = getContentFieldDefinitions("link", values, validation)

    expect(fields).toEqual([
      expect.objectContaining({ id: "url", label: "URL", type: "text", inputKind: "url" }),
    ])
  })

  it("maps platform profile intents to a labeled url field", () => {
    const values = getDefaultStaticQrValues("instagram")
    const validation = validateStaticQrContent("instagram", values)
    const fields = getContentFieldDefinitions("instagram", values, validation)

    expect(fields.some((field) => field.id === "url" && field.label === "URL")).toBe(true)
  })
})
