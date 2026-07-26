import { describe, expect, it } from "vitest"

import {
  detectPastedContent,
  detectUrlKind,
} from "@/features/qr-code/content/detect-url-kind"

describe("detectUrlKind", () => {
  it("detects major social platforms from hostnames", () => {
    expect(detectUrlKind("https://instagram.com/newqr")).toMatchObject({
      platform: "instagram",
      category: "social",
      brandIconId: "instagram",
      inputTypeHint: "instagram",
      confidence: "high",
    })

    expect(detectUrlKind("https://x.com/newqr")).toMatchObject({
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

    expect(detectUrlKind("https://www.tiktok.com/@newqr")).toMatchObject({
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
      platform: "form",
      category: "form",
      inputTypeHint: "form",
    })

    expect(detectUrlKind("https://apps.apple.com/app/id123")).toMatchObject({
      platform: "app-download",
      category: "app",
      inputTypeHint: "app-download",
    })

    expect(detectUrlKind("https://maps.google.com/?q=Mumbai")).toMatchObject({
      platform: "map-location",
      category: "location",
      brandIconId: "google-maps",
      inputTypeHint: "map-location",
    })
  })

  it("detects file URLs from extensions", () => {
    expect(detectUrlKind("https://cdn.example.com/menu.pdf")).toMatchObject({
      platform: "pdf",
      category: "file",
      inputTypeHint: "pdf",
    })

    expect(detectUrlKind("https://cdn.example.com/poster.png")).toMatchObject({
      platform: "image",
      category: "file",
      inputTypeHint: "image",
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

  it("marks booking and payment hosts as low confidence", () => {
    expect(detectUrlKind("https://calendly.com/newqr/30min")).toMatchObject({
      category: "booking",
      confidence: "low",
      inputTypeHint: "booking-link",
    })

    expect(detectUrlKind("https://paypal.me/newqr")).toMatchObject({
      category: "payment",
      confidence: "low",
      inputTypeHint: "payment-link",
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
  })

  it("wraps URLs with url detection metadata", () => {
    expect(detectPastedContent("instagram.com/newqr")).toEqual({
      kind: "link",
      value: "instagram.com/newqr",
      urlDetection: {
        platform: "instagram",
        category: "social",
        brandIconId: "instagram",
        inputTypeHint: "instagram",
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
