import { describe, expect, it } from "vitest"

import {
  isPositiveAmount,
  isValidEmail,
  isValidPhone,
  isValidPlatformUrl,
  isValidUrl,
  platformUrlErrorMessage,
} from "@/features/qr-code/content/content-field-validation"

describe("content field validation helpers", () => {
  it("accepts URL stubs and normalized URLs", () => {
    expect(isValidUrl("https://")).toBe(true)
    expect(isValidUrl("https://instagram.com/")).toBe(true)
    expect(isValidUrl("instagram.com/qrafty")).toBe(true)
    expect(isValidUrl("skype:")).toBe(true)
  })

  it("rejects malformed or bare-word URLs", () => {
    expect(isValidUrl("not a url")).toBe(false)
    expect(isValidUrl("://bad")).toBe(false)
    expect(isValidUrl("asdf")).toBe(false)
    expect(isValidUrl("hello world")).toBe(false)
  })

  it("requires platform host match", () => {
    expect(isValidPlatformUrl("https://instagram.com/qrafty", ["instagram.com"])).toBe(true)
    expect(isValidPlatformUrl("https://instagram.com/", ["instagram.com"])).toBe(true)
    expect(isValidPlatformUrl("https://youtube.com/watch?v=abc", ["instagram.com"])).toBe(false)
    expect(isValidPlatformUrl("asdf", ["instagram.com"])).toBe(false)
    expect(isValidPlatformUrl("https://", ["instagram.com"])).toBe(false)
  })

  it("builds category-aware messages", () => {
    expect(platformUrlErrorMessage("Profile")).toBe("Enter a correct profile URL.")
  })

  it("validates email and phone formats", () => {
    expect(isValidEmail("hello@example.com")).toBe(true)
    expect(isValidEmail("bad-email")).toBe(false)
    expect(isValidPhone("+1 (555) 010-2000")).toBe(true)
    expect(isValidPhone("12345")).toBe(false)
  })

  it("validates positive amounts", () => {
    expect(isPositiveAmount("199.00")).toBe(true)
    expect(isPositiveAmount("0")).toBe(false)
    expect(isPositiveAmount("-1")).toBe(false)
  })
})
