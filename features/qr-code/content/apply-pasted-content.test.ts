import { describe, expect, it } from "vitest"

import {
  getLinkDetectionSource,
  getLinkPasteFieldUpdate,
  resolveDetectedLinkTypeApply,
  resolveStructuredPasteApply,
  shouldShowUrlDetectionChip,
} from "@/features/qr-code/content/apply-pasted-content"

describe("resolveStructuredPasteApply", () => {
  it("maps structured scheme pastes to dedicated content types", () => {
    expect(resolveStructuredPasteApply("tel:+15550102000")).toEqual({
      type: "phone",
      values: { phone: "+15550102000" },
    })

    expect(resolveStructuredPasteApply("mailto:hello@example.com?subject=Launch")).toEqual({
      type: "email",
      values: {
        email: "hello@example.com",
        subject: "Launch",
        body: "",
      },
    })

    expect(resolveStructuredPasteApply("WIFI:T:WPA;S:Cafe;P:secret;H:true;;")).toEqual({
      type: "wifi",
      values: {
        hidden: true,
        password: "secret",
        security: "WPA",
        ssid: "Cafe",
      },
    })

    expect(
      resolveStructuredPasteApply("upi://pay?pa=merchant@okaxis&pn=New%20QR&am=199.00&cu=INR&tn=Order"),
    ).toEqual({
      type: "upi",
      values: {
        amount: "199.00",
        currency: "INR",
        note: "Order",
        payeeName: "New QR",
        vpa: "merchant@okaxis",
      },
    })

    expect(
      resolveStructuredPasteApply("ethereum:0x1111111111111111111111111111111111111111?amount=1.5"),
    ).toEqual({
      type: "crypto",
      values: {
        address: "0x1111111111111111111111111111111111111111",
        amount: "1.5",
        asset: "ethereum",
      },
    })
  })

  it("returns null for plain text and link pastes", () => {
    expect(resolveStructuredPasteApply("hello world")).toBeNull()
    expect(resolveStructuredPasteApply("https://instagram.com/newqr")).toBeNull()
  })
})

describe("getLinkPasteFieldUpdate", () => {
  it("keeps link pastes on the current link-like content type", () => {
    expect(getLinkPasteFieldUpdate("link", "https://instagram.com/newqr")).toEqual({
      values: { url: "https://instagram.com/newqr" },
      urlDetection: expect.objectContaining({
        platform: "instagram",
      }),
    })

    expect(getLinkPasteFieldUpdate("instagram", "https://instagram.com/newqr")).toEqual({
      values: { username: "https://instagram.com/newqr" },
      urlDetection: expect.objectContaining({
        platform: "instagram",
      }),
    })
  })
})

describe("resolveDetectedLinkTypeApply", () => {
  it("builds a type switch apply payload from detection metadata", () => {
    expect(
      resolveDetectedLinkTypeApply(
        {
          category: "social",
          confidence: "high",
          inputTypeHint: "instagram",
          platform: "instagram",
        },
        "https://instagram.com/newqr",
      ),
    ).toEqual({
      type: "instagram",
      values: { username: "https://instagram.com/newqr" },
      urlDetection: expect.objectContaining({
        platform: "instagram",
      }),
    })
  })
})

describe("getLinkDetectionSource", () => {
  it("reads the active url or username field for detection", () => {
    expect(
      getLinkDetectionSource("link", {
        url: "https://example.com",
      }),
    ).toBe("https://example.com")

    expect(
      getLinkDetectionSource("instagram", {
        username: "@newqr",
      }),
    ).toBe("@newqr")
  })
})

describe("shouldShowUrlDetectionChip", () => {
  it("shows chips for known platforms but not generic links", () => {
    expect(
      shouldShowUrlDetectionChip("link", {
        category: "social",
        confidence: "high",
        platform: "instagram",
        inputTypeHint: "instagram",
      }),
    ).toBe(true)

    expect(
      shouldShowUrlDetectionChip("link", {
        category: "link",
        confidence: "low",
        inputTypeHint: "link",
      }),
    ).toBe(false)
  })
})
