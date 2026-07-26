import { describe, expect, it } from "vitest"

import { getContentTypeIcon } from "@/features/qr-code/content/content-type-icons"

describe("content type icons", () => {
  it("uses hugeicons brand icons for major social platforms", () => {
    expect(getContentTypeIcon("instagram")).toEqual({
      kind: "hugeicons",
      icon: expect.any(Array),
    })
    expect(getContentTypeIcon("whatsapp")).toMatchObject({ kind: "hugeicons" })
    expect(getContentTypeIcon("youtube")).toMatchObject({ kind: "hugeicons" })
  })

  it("falls back to brand catalog icons when hugeicons has no match", () => {
    expect(getContentTypeIcon("line")).toMatchObject({ kind: "brand" })
    expect(getContentTypeIcon("signal")).toMatchObject({ kind: "brand" })
  })
})
