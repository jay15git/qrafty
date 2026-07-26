import { describe, expect, it } from "vitest"

import {
  buildPlatformPayload,
  detectPlatformIntentFromUrl,
  getDefaultIntentId,
  getPlatformDefaultValuesForIntent,
  getPlatformDef,
  PLATFORM_PICKER_TYPES,
} from "@/features/qr-code/content/platform-intents"

describe("platform intent registry", () => {
  it("includes the expanded catalog in picker types", () => {
    expect(PLATFORM_PICKER_TYPES).toContain("instagram")
    expect(PLATFORM_PICKER_TYPES).toContain("spotify")
    expect(PLATFORM_PICKER_TYPES).toContain("github")
  })

  it("detects platform and intent from known URLs", () => {
    expect(detectPlatformIntentFromUrl("https://instagram.com/newqr")).toEqual({
      type: "instagram",
      intent: "profile",
      platform: "instagram",
      brandIconId: "instagram",
    })

    expect(detectPlatformIntentFromUrl("https://open.spotify.com/track/abc")).toEqual({
      type: "spotify",
      intent: "track",
      platform: "spotify",
      brandIconId: undefined,
    })

    expect(detectPlatformIntentFromUrl("https://apps.apple.com/app/id123456789")).toEqual({
      type: "app-store",
      intent: "app",
      platform: "app-store",
      brandIconId: undefined,
    })
  })

  it("builds profile and post URLs from guided fields", () => {
    expect(
      buildPlatformPayload("instagram", {
        intent: "profile",
        username: "@newqr",
      }),
    ).toBe("https://instagram.com/newqr")

    expect(
      buildPlatformPayload("telegram", {
        intent: "message",
        username: "newqr",
        message: "Hello",
      }),
    ).toBe(`https://t.me/newqr?text=${encodeURIComponent("Hello")}`)
  })

  it("defaults to the first intent for each platform", () => {
    expect(getDefaultIntentId("instagram")).toBe("profile")
    expect(getDefaultIntentId("spotify")).toBe("track")
    expect(getPlatformDef("instagram")?.intents.length).toBeGreaterThan(1)
  })

  it("prefills stub values for platform intents", () => {
    expect(getPlatformDefaultValuesForIntent("youtube", "video")).toEqual({
      intent: "video",
      url: "https://youtube.com/watch?v=",
    })

    expect(getPlatformDefaultValuesForIntent("instagram", "profile")).toEqual({
      intent: "profile",
      username: "",
    })
  })
})
