import { describe, expect, it } from "vitest"

import {
  buildPlatformPayload,
  detectPlatformIntentFromUrl,
  getDefaultIntentId,
  getPlatformDefaultValuesForIntent,
  getPlatformDef,
  PLATFORM_PICKER_TYPES,
  validatePlatformContent,
} from "@/features/qr-code/content/platform-intents"
import { getIntentSampleValues } from "@/features/qr-code/content/platform-samples"

describe("platform intent registry", () => {
  it("includes the expanded catalog in picker types", () => {
    expect(PLATFORM_PICKER_TYPES).toContain("instagram")
    expect(PLATFORM_PICKER_TYPES).toContain("spotify")
    expect(PLATFORM_PICKER_TYPES).toContain("github")
  })

  it("detects platform and intent from known URLs", () => {
    expect(detectPlatformIntentFromUrl("https://instagram.com/qrafty")).toEqual({
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
        url: "https://instagram.com/qrafty",
      }),
    ).toBe("https://instagram.com/qrafty")

    expect(
      buildPlatformPayload("telegram", {
        intent: "message",
        url: "https://t.me/qrafty",
        message: "Hello",
      }),
    ).toBe(`https://t.me/qrafty?text=${encodeURIComponent("Hello")}`)
  })

  it("defaults to sensible primary intents", () => {
    expect(getDefaultIntentId("instagram")).toBe("profile")
    expect(getDefaultIntentId("spotify")).toBe("track")
    expect(getDefaultIntentId("tiktok")).toBe("profile")
    expect(getDefaultIntentId("facebook")).toBe("profile")
    expect(getPlatformDef("instagram")?.intents.length).toBeGreaterThan(1)
  })

  it("prefills stub values for platform intents", () => {
    expect(getPlatformDefaultValuesForIntent("youtube", "video")).toEqual({
      intent: "video",
      url: "https://youtube.com/watch?v=",
    })

    expect(getPlatformDefaultValuesForIntent("instagram", "profile")).toEqual({
      intent: "profile",
      url: "https://instagram.com/",
    })

    expect(getPlatformDefaultValuesForIntent("tiktok", "video")).toEqual({
      intent: "video",
      url: "https://www.tiktok.com/@qrafty/video/",
    })
  })

  it("flags invalid platform URL formats", () => {
    expect(
      validatePlatformContent("instagram", {
        intent: "profile",
        url: "not a valid url",
      }),
    ).toEqual({
      url: "Enter a correct profile URL.",
    })

    expect(
      validatePlatformContent("instagram", {
        intent: "profile",
        url: "https://youtube.com/watch?v=abc",
      }),
    ).toEqual({
      url: "Enter a correct profile URL.",
    })

    expect(
      validatePlatformContent("instagram", {
        intent: "profile",
        url: "https://instagram.com/p/ABC123",
      }),
    ).toEqual({
      url: "Enter a correct profile URL.",
    })

    expect(
      validatePlatformContent("instagram", {
        intent: "profile",
        url: "https://instagram.com/qrafty",
      }),
    ).toEqual({})
  })
})

describe("intent-specific URL catalog", () => {
  const detectionCases = [
    ["https://www.tiktok.com/@qrafty", "tiktok", "profile"],
    ["https://www.tiktok.com/@qrafty/video/7123456789012345678", "tiktok", "video"],
    ["https://www.tiktok.com/@qrafty/live", "tiktok", "live"],
    ["https://vm.tiktok.com/ZS81uRSRR/", "tiktok", "video"],
    ["https://www.facebook.com/qrafty/posts/pfbid0abc123", "facebook", "post"],
    ["https://www.facebook.com/groups/qrafty", "facebook", "group"],
    ["https://www.threads.net/@qrafty/post/CuXyZ123abc", "threads", "post"],
    ["https://www.pinterest.com/qrafty/board-name/", "pinterest", "board"],
    ["https://www.reddit.com/r/qrafty/comments/abc123/title_slug/", "reddit", "post"],
    [
      "https://www.reddit.com/r/qrafty/comments/abc123/title_slug/def456/",
      "reddit",
      "comment",
    ],
    ["https://www.twitch.tv/videos/1234567890", "twitch", "video"],
    ["https://clips.twitch.tv/AbcDefGhiJkLm", "twitch", "clip"],
    [
      "https://bsky.app/profile/qrafty.bsky.social/post/3kxabcdef123",
      "bluesky",
      "post",
    ],
    ["https://t.me/qrafty?text=Hello", "telegram", "message"],
    [
      "https://discord.com/channels/123456789012345678/987654321098765432",
      "discord",
      "channel",
    ],
    ["https://music.apple.com/us/song/title/1234567890", "apple-music", "song"],
    ["https://soundcloud.com/qrafty/track-name", "soundcloud", "track"],
    ["https://github.com/qrafty/qrafty/issues/1", "github", "issue"],
    ["https://gist.github.com/qrafty/abc123def456", "github", "gist"],
    ["https://gitlab.com/qrafty/qrafty/-/issues/1", "gitlab", "issue"],
    ["https://medium.com/@qrafty/my-story-title-abc123", "medium", "story"],
    ["https://qrafty.substack.com/p/post-title", "substack", "post"],
    ["https://venmo.com/u/qrafty?txn=1234567890", "venmo", "payment"],
  ] as const

  it.each(detectionCases)("detects %s as %s %s", (url, type, intent) => {
    expect(detectPlatformIntentFromUrl(url)).toMatchObject({ type, intent })
  })

  const crossIntentValidationCases = [
    [
      "tiktok",
      "profile",
      "https://www.tiktok.com/@qrafty/video/7123456789012345678",
      "Enter a correct profile URL.",
    ],
    [
      "facebook",
      "profile",
      "https://www.facebook.com/qrafty/posts/pfbid0abc123",
      "Enter a correct profile URL.",
    ],
    [
      "threads",
      "profile",
      "https://www.threads.net/@qrafty/post/CuXyZ123abc",
      "Enter a correct profile URL.",
    ],
    [
      "discord",
      "server",
      "https://discord.com/channels/123456789012345678/987654321098765432",
      "Enter a correct server URL.",
    ],
    [
      "soundcloud",
      "user",
      "https://soundcloud.com/qrafty/track-name",
      "Enter a correct user URL.",
    ],
    [
      "venmo",
      "profile",
      "https://venmo.com/u/qrafty?txn=1234567890",
      "Enter a correct profile URL.",
    ],
  ] as const

  it.each(crossIntentValidationCases)(
    "rejects wrong-shape URL for %s %s intent",
    (type, intent, url, message) => {
      expect(validatePlatformContent(type, { intent, url })).toEqual({
        url: message,
      })
    },
  )

  it("keeps distinct canonical prefills per intent", () => {
    const auditedTypes = [
      "tiktok",
      "facebook",
      "threads",
      "pinterest",
      "reddit",
      "twitch",
      "bluesky",
      "mastodon",
      "tumblr",
      "telegram",
      "discord",
      "line",
      "apple-music",
      "soundcloud",
      "github",
      "gitlab",
      "medium",
      "substack",
      "venmo",
    ] as const

    for (const type of auditedTypes) {
      const def = getPlatformDef(type)
      expect(def).toBeDefined()

      const urls = def!.intents
        .map((intent) => getIntentSampleValues(type, intent.id).url)
        .filter((url): url is string => typeof url === "string" && url.length > 0)

      expect(new Set(urls).size, `${type} prefills should be unique`).toBe(urls.length)
    }
  })

  it("validates mastodon profile vs post URLs", () => {
    expect(
      validatePlatformContent("mastodon", {
        intent: "profile",
        url: "https://mastodon.social/@qrafty/112233445566778899",
      }),
    ).toEqual({
      url: "Enter a correct profile URL.",
    })

    expect(
      validatePlatformContent("mastodon", {
        intent: "post",
        url: "https://mastodon.social/@qrafty/112233445566778899",
      }),
    ).toEqual({})
  })

  it("requires matchPath on audited multi-intent URL platforms", () => {
    const auditedTypes = [
      "tiktok",
      "facebook",
      "threads",
      "pinterest",
      "reddit",
      "twitch",
      "bluesky",
      "mastodon",
      "tumblr",
      "telegram",
      "discord",
      "line",
      "apple-music",
      "soundcloud",
      "github",
      "gitlab",
      "medium",
      "substack",
      "venmo",
    ] as const

    for (const type of auditedTypes) {
      const def = getPlatformDef(type)
      expect(def).toBeDefined()

      const urlIntents = def!.intents.filter((intent) =>
        intent.fields.some((field) => field.kind === "url"),
      )

      if (urlIntents.length < 2) {
        continue
      }

      for (const intent of urlIntents) {
        expect(intent.matchPath, `${type}/${intent.id} missing matchPath`).toBeTypeOf(
          "function",
        )
      }
    }
  })
})
