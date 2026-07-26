import { describe, expect, it } from "vitest"

import {
  detectPastedContent,
  detectUrlKind,
} from "@/features/qr-code/content/detect-url-kind"

describe("detectUrlKind", () => {
  it("detects major social platforms from hostnames", () => {
    expect(detectUrlKind("https://instagram.com/qrafty")).toMatchObject({
      platform: "instagram",
      category: "social",
      brandIconId: "instagram",
      inputTypeHint: "instagram",
      confidence: "high",
    })

    expect(detectUrlKind("https://x.com/qrafty")).toMatchObject({
      platform: "x",
      category: "social",
      brandIconId: "x",
      inputTypeHint: "x",
    })

    expect(detectUrlKind("https://youtu.be/demo")).toMatchObject({
      platform: "youtube",
      category: "social",
      inputTypeHint: "youtube",
    })

    expect(detectUrlKind("https://www.tiktok.com/@qrafty")).toMatchObject({
      platform: "tiktok",
      category: "social",
      inputTypeHint: "tiktok",
    })
  })

  it("detects invite, form, app, and map URLs", () => {
    expect(detectUrlKind("https://discord.gg/launch")).toMatchObject({
      platform: "discord",
      category: "social",
      inputTypeHint: "discord",
    })

    expect(detectUrlKind("https://forms.gle/abc123")).toMatchObject({
      platform: "google-forms",
      category: "business",
      inputTypeHint: "google-forms",
      intent: "short",
    })

    expect(detectUrlKind("https://docs.google.com/document/d/abc123/edit")).toMatchObject({
      category: "link",
      confidence: "low",
      inputTypeHint: "link",
    })

    expect(detectUrlKind("https://apps.apple.com/app/id123")).toMatchObject({
      platform: "app-store",
      category: "app",
      inputTypeHint: "app-store",
      intent: "app",
    })

    expect(detectUrlKind("https://maps.google.com/?q=Mumbai")).toMatchObject({
      platform: "map-location",
      category: "location",
      brandIconId: "google-maps",
      inputTypeHint: "map-location",
    })
  })

  it("treats file extension URLs as generic links", () => {
    expect(detectUrlKind("https://cdn.example.com/menu.pdf")).toMatchObject({
      category: "link",
      confidence: "low",
      inputTypeHint: "link",
    })

    expect(detectUrlKind("https://cdn.example.com/poster.png")).toMatchObject({
      category: "link",
      confidence: "low",
      inputTypeHint: "link",
    })
  })

  it("returns low-confidence link fallback for generic websites", () => {
    expect(detectUrlKind("example.com/launch")).toMatchObject({
      category: "link",
      confidence: "low",
      inputTypeHint: "link",
    })
  })

  it("returns null for empty or non-url values", () => {
    expect(detectUrlKind("")).toBeNull()
    expect(detectUrlKind("plain text")).toBeNull()
  })

  it("detects booking, payment, and form hosts from the platform catalog", () => {
    expect(detectUrlKind("https://calendly.com/qrafty/30min")).toMatchObject({
      category: "business",
      confidence: "high",
      inputTypeHint: "calendly",
      intent: "event",
    })

    expect(detectUrlKind("https://cal.com/qrafty/30min")).toMatchObject({
      platform: "cal-com",
      intent: "event",
    })

    expect(detectUrlKind("https://buy.stripe.com/test_abc")).toMatchObject({
      platform: "stripe",
      intent: "pay",
    })

    expect(detectUrlKind("https://forms.office.com/r/abc123")).toMatchObject({
      platform: "microsoft-forms",
      intent: "form",
    })

    expect(detectUrlKind("https://paypal.me/qrafty")).toMatchObject({
      category: "business",
      confidence: "high",
      inputTypeHint: "paypal-me",
      intent: "profile",
    })
  })
})

describe("detectPastedContent", () => {
  it("detects URI scheme payloads before URL rules", () => {
    expect(detectPastedContent("tel:+15550102000")).toEqual({
      kind: "phone",
      value: "+15550102000",
    })

    expect(detectPastedContent("mailto:hello@example.com")).toEqual({
      kind: "email",
      value: "hello@example.com",
    })

    expect(detectPastedContent("sms:+15550102000?body=Hi")).toEqual({
      kind: "sms",
      value: "+15550102000?body=Hi",
    })

    expect(detectPastedContent("WIFI:T:WPA;S:Cafe;P:secret;;")).toEqual({
      kind: "wifi",
      value: "WIFI:T:WPA;S:Cafe;P:secret;;",
    })

    expect(detectPastedContent("BEGIN:VCARD\nVERSION:3.0\nEND:VCARD")).toEqual({
      kind: "vcard",
      value: "BEGIN:VCARD\nVERSION:3.0\nEND:VCARD",
    })

    expect(
      detectPastedContent("upi://pay?pa=merchant@okaxis&pn=New%20QR&am=10&cu=INR"),
    ).toEqual({
      kind: "upi",
      value: "upi://pay?pa=merchant@okaxis&pn=New%20QR&am=10&cu=INR",
    })

    expect(
      detectPastedContent("bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.01"),
    ).toEqual({
      kind: "crypto",
      value: "bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.01",
    })
  })

  it("wraps URLs with url detection metadata", () => {
    expect(detectPastedContent("instagram.com/qrafty")).toEqual({
      kind: "link",
      value: "instagram.com/qrafty",
      urlDetection: {
        platform: "instagram",
        category: "social",
        brandIconId: "instagram",
        inputTypeHint: "instagram",
        intent: "profile",
        confidence: "high",
      },
    })
  })

  it("detects bare email and phone values", () => {
    expect(detectPastedContent("hello@example.com")).toEqual({
      kind: "email",
      value: "hello@example.com",
    })

    expect(detectPastedContent("+1 555 010 2000")).toEqual({
      kind: "phone",
      value: "+1 555 010 2000",
    })
  })

  it("falls back to plain text", () => {
    expect(detectPastedContent("Launch week invite")).toEqual({
      kind: "text",
      value: "Launch week invite",
    })
  })
})
