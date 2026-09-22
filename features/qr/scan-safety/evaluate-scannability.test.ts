import { describe, expect, it } from "vitest"

import {
  createPendingScannabilityResult,
  createSkippedScannabilityResult,
  createUnavailableScannabilityResult,
  evaluateScannability,
  shouldSkipScannabilityCheck,
} from "@/features/qr/scan-safety/evaluate-scannability"

describe("evaluateScannability", () => {
  it("returns valid when decoded text matches expected", () => {
    const result = evaluateScannability("https://example.com", "https://example.com")

    expect(result.status).toBe("valid")
    expect(result.summary).toBe("Valid")
    expect(result.decodedText).toBe("https://example.com")
  })

  it("returns invalid when decode fails", () => {
    const result = evaluateScannability("https://example.com", null)

    expect(result.status).toBe("invalid")
    expect(result.summary).toBe("Not scannable")
    expect(result.decodedText).toBeNull()
  })

  it("returns invalid when decoded text mismatches", () => {
    const result = evaluateScannability("https://example.com", "https://other.com")

    expect(result.status).toBe("invalid")
    expect(result.summary).toBe("Not scannable")
  })
})

describe("scannability helpers", () => {
  it("creates skipped result with no content summary", () => {
    const result = createSkippedScannabilityResult()

    expect(result.status).toBe("skipped")
    expect(result.summary).toBe("No content")
  })

  it("creates pending result with checking summary", () => {
    const result = createPendingScannabilityResult("hello")

    expect(result.status).toBe("pending")
    expect(result.summary).toBe("Checking…")
    expect(result.expectedText).toBe("hello")
  })

  it("keeps analyzer failures unavailable instead of falsely invalid", () => {
    const result = createUnavailableScannabilityResult("hello")

    expect(result.status).toBe("unavailable")
    expect(result.summary).toBe("Unavailable")
    expect(result.score).toBeNull()
  })

  it("skips when content is invalid or empty", () => {
    expect(shouldSkipScannabilityCheck(true, "", true)).toBe(true)
    expect(shouldSkipScannabilityCheck(false, "hello", true)).toBe(true)
    expect(shouldSkipScannabilityCheck(true, "hello", false)).toBe(true)
    expect(shouldSkipScannabilityCheck(true, "hello", true)).toBe(false)
  })
})
