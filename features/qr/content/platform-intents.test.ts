import { describe, expect, it } from "vitest";

import {
  detectPlatformIntentFromUrl,
  getDefaultIntentId,
  getPlatformDef,
} from "@/features/qr/content/platform-intents";

describe("platform detection", () => {
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
    ["https://www.reddit.com/r/qrafty/comments/abc123/title_slug/def456/", "reddit", "comment"],
    ["https://www.twitch.tv/videos/1234567890", "twitch", "video"],
    ["https://clips.twitch.tv/AbcDefGhiJkLm", "twitch", "clip"],
    ["https://bsky.app/profile/qrafty.bsky.social/post/3kxabcdef123", "bluesky", "post"],
    ["https://t.me/qrafty?text=Hello", "telegram", "message"],
    ["https://discord.com/channels/123456789012345678/987654321098765432", "discord", "channel"],
    ["https://music.apple.com/us/song/title/1234567890", "apple-music", "song"],
    ["https://soundcloud.com/qrafty/track-name", "soundcloud", "track"],
    ["https://github.com/qrafty/qrafty/issues/1", "github", "issue"],
    ["https://gist.github.com/qrafty/abc123def456", "github", "gist"],
    ["https://gitlab.com/qrafty/qrafty/-/issues/1", "gitlab", "issue"],
    ["https://medium.com/@qrafty/my-story-title-abc123", "medium", "story"],
    ["https://qrafty.substack.com/p/post-title", "substack", "post"],
    ["https://venmo.com/u/qrafty?txn=1234567890", "venmo", "payment"],
    ["https://forms.gle/abc123", "google-forms", "short"],
    ["https://docs.google.com/forms/d/e/1FAIpQLSd/viewform", "google-forms", "form"],
    ["https://forms.office.com/r/abc123", "microsoft-forms", "form"],
    ["https://form.typeform.com/to/abc123", "typeform", "form"],
    ["https://tally.so/r/abc123", "tally", "form"],
    ["https://form.jotform.com/1234567890", "jotform", "form"],
    ["https://calendly.com/qrafty/30min", "calendly", "event"],
    ["https://calendly.com/d/abc123", "calendly", "one-off"],
    ["https://cal.com/qrafty/30min", "cal-com", "event"],
    ["https://cal.com/team/qrafty/30min", "cal-com", "team"],
    ["https://www.booking.com/hotel/us/example.html", "booking-com", "hotel"],
    [
      "https://qrafty.acuityscheduling.com/schedule.php?appointmentType=123",
      "acuity",
      "appointment",
    ],
    ["https://buy.stripe.com/test_abc", "stripe", "pay"],
    ["https://checkout.stripe.com/c/pay/cs_test", "stripe", "checkout"],
    ["https://rzp.io/l/abc123", "razorpay", "link"],
    ["https://square.link/u/abc123", "square", "checkout"],
  ] as const;

  it.each(detectionCases)("detects %s as %s %s", (url, type, intent) => {
    expect(detectPlatformIntentFromUrl(url)).toMatchObject({ type, intent });
  });

  it("returns null for non-platform URLs", () => {
    expect(detectPlatformIntentFromUrl("https://example.com/page")).toBeNull();
    expect(detectPlatformIntentFromUrl("")).toBeNull();
    expect(detectPlatformIntentFromUrl("not a url at all!!!")).toBeNull();
  });

  it("labels picker platform types for the detection chip", () => {
    expect(getPlatformDef("whatsapp")?.label).toBe("WhatsApp");
    expect(getPlatformDef("map-location")?.label).toBe("Google Maps");
    // Legacy alias resolves to the live picker def.
    expect(getPlatformDef("whatsapp-chat")?.type).toBe("whatsapp");
  });

  it("exposes default intent ids for picker platforms", () => {
    expect(getDefaultIntentId("whatsapp")).toBe("chat");
    expect(getDefaultIntentId("map-location")).toBe("place");
  });
});
