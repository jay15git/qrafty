import { describe, expect, it } from "vitest"

import {
  buildStaticQrPayload,
  getContentValuesForTypeChange,
  getDefaultStaticQrValues,
  validateStaticQrContent,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"

describe("static QR content payloads", () => {
  it("escapes reserved Wi-Fi characters and includes hidden network metadata", () => {
    const payload = buildStaticQrPayload("wifi", {
      hidden: true,
      password: "pa;ss,wo:rd\\",
      security: "WPA",
      ssid: "Cafe;Guest,5G:North\\",
    })

    expect(payload).toBe(
      String.raw`WIFI:T:WPA;S:Cafe\;Guest\,5G\:North\\;P:pa\;ss\,wo\:rd\\;H:true;;`,
    )
  })

  it("builds static URI payloads for phone, SMS, email, WhatsApp, Telegram, and maps", () => {
    expect(buildStaticQrPayload("phone", { phone: "+1 (555) 010-2000" })).toBe(
      "tel:+15550102000",
    )
    expect(
      buildStaticQrPayload("sms", {
        message: "Bring menus",
        phone: "+1 (555) 010-2000",
      }),
    ).toBe("sms:+15550102000?body=Bring%20menus")
    expect(
      buildStaticQrPayload("email", {
        body: "Hello team",
        email: "hello@example.com",
        subject: "Launch",
      }),
    ).toBe("mailto:hello@example.com?subject=Launch&body=Hello%20team")
    expect(
      buildStaticQrPayload("whatsapp-chat", {
        message: "I would like to book",
        phone: "+91 98765 43210",
      }),
    ).toBe("https://wa.me/919876543210?text=I%20would%20like%20to%20book")
    expect(buildStaticQrPayload("telegram-username", { username: "@newqr" })).toBe(
      "https://t.me/newqr",
    )
    expect(
      buildStaticQrPayload("map-location", {
        intent: "place",
        latitude: "19.0760",
        longitude: "72.8777",
        query: "Mumbai",
      }),
    ).toBe("geo:19.0760,72.8777?q=Mumbai")
  })

  it("builds vCard payloads while omitting empty optional fields", () => {
    const payload = buildStaticQrPayload("vcard", {
      company: "New QR",
      email: "jay@example.com",
      firstName: "Jay",
      lastName: "Shah",
      phone: "+91 98765 43210",
      title: "",
      url: "https://example.com",
    })

    expect(payload).toBe(
      [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Shah;Jay;;;",
        "FN:Jay Shah",
        "ORG:New QR",
        "TEL:+919876543210",
        "EMAIL:jay@example.com",
        "URL:https://example.com",
        "END:VCARD",
      ].join("\n"),
    )
    expect(payload).not.toContain("TITLE:")
  })

  it("builds event URLs by default and iCalendar payloads when full event fields are enabled", () => {
    expect(
      buildStaticQrPayload("event", {
        eventMode: "url",
        url: "example.com/rsvp",
      }),
    ).toBe("https://example.com/rsvp")

    expect(
      buildStaticQrPayload("event", {
        description: "Bring the printed pass",
        end: "2026-06-01T10:30",
        eventMode: "calendar",
        location: "Studio 2",
        start: "2026-06-01T09:00",
        title: "Launch Briefing",
      }),
    ).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "SUMMARY:Launch Briefing",
        "DTSTART:20260601T090000",
        "DTEND:20260601T103000",
        "LOCATION:Studio 2",
        "DESCRIPTION:Bring the printed pass",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\n"),
    )
  })

  it("builds social and static link content as normalized URLs", () => {
    const cases: Array<[Parameters<typeof buildStaticQrPayload>[0], StaticQrContentValues, string]> =
      [
        ["instagram", { intent: "profile", username: "@newqr" }, "https://instagram.com/newqr"],
        ["facebook", { intent: "profile", url: "facebook.com/newqr" }, "https://facebook.com/newqr"],
        ["x", { intent: "profile", username: "newqr" }, "https://x.com/newqr"],
        ["youtube", { intent: "channel", url: "youtube.com/@newqr" }, "https://youtube.com/@newqr"],
        ["linkedin", { intent: "profile", url: "linkedin.com/company/newqr" }, "https://linkedin.com/company/newqr"],
        ["tiktok", { intent: "profile", username: "@newqr" }, "https://tiktok.com/@newqr"],
        ["snapchat", { intent: "add", username: "newqr" }, "https://snapchat.com/add/newqr"],
        ["threads", { intent: "profile", username: "@newqr" }, "https://threads.net/@newqr"],
        ["pinterest", { intent: "profile", username: "newqr" }, "https://pinterest.com/newqr"],
        ["discord", { intent: "invite", url: "discord.gg/newqr" }, "https://discord.gg/newqr"],
        ["pdf", { intent: "url", url: "example.com/menu.pdf" }, "https://example.com/menu.pdf"],
        ["coupon", { code: "SAVE20", description: "20% off", url: "example.com/save" }, "SAVE20\n20% off\nhttps://example.com/save"],
      ]

    for (const [type, values, expected] of cases) {
      expect(buildStaticQrPayload(type, values)).toBe(expected)
    }
  })

  it("validates required values for fragile static payloads", () => {
    expect(validateStaticQrContent("wifi", { ssid: "" })).toEqual({
      fieldErrors: { ssid: "Enter a network name." },
      isValid: false,
    })
    expect(validateStaticQrContent("vcard", getDefaultStaticQrValues("vcard"))).toEqual({
      fieldErrors: {
        firstName: "Add a name, phone, or email.",
      },
      isValid: false,
    })
    expect(
      validateStaticQrContent("map-location", {
        intent: "place",
        latitude: "95",
        longitude: "200",
      }),
    ).toEqual({
      fieldErrors: {
        latitude: "Latitude must be between -90 and 90.",
        longitude: "Longitude must be between -180 and 180.",
      },
      isValid: false,
    })
  })

  it("migrates url alias values when switching picker types to link", () => {
    expect(
      getContentValuesForTypeChange("pdf", "link", {
        url: "https://example.com/menu.pdf",
      }),
    ).toEqual({
      url: "https://example.com/menu.pdf",
    })

    expect(
      getContentValuesForTypeChange("instagram", "link", {
        username: "https://instagram.com/newqr",
      }),
    ).toEqual({
      url: "https://instagram.com/newqr",
    })
  })

  it("uses platform stubs when switching from link without a matching platform URL", () => {
    expect(
      getContentValuesForTypeChange("link", "youtube", {
        url: "https://example.com",
      }),
    ).toEqual({
      intent: "channel",
      username: "",
      url: "https://youtube.com/@",
    })
  })

  it("extracts platform values when switching from link with a matching platform URL", () => {
    expect(
      getContentValuesForTypeChange("link", "youtube", {
        url: "https://youtube.com/watch?v=abc123",
      }),
    ).toMatchObject({
      intent: "video",
      url: "https://youtube.com/watch?v=abc123",
    })
  })

  it("builds UPI and crypto payment payloads", () => {
    expect(
      buildStaticQrPayload("upi", {
        amount: "199.00",
        currency: "INR",
        note: "Order 42",
        payeeName: "New QR",
        vpa: "merchant@okaxis",
      }),
    ).toBe(
      "upi://pay?pa=merchant%40okaxis&pn=New%20QR&am=199.00&cu=INR&tn=Order%2042",
    )

    expect(
      buildStaticQrPayload("crypto", {
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        amount: "0.01",
        asset: "bitcoin",
      }),
    ).toBe("bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.01")

    expect(
      buildStaticQrPayload("crypto", {
        address: "0x1111111111111111111111111111111111111111",
        asset: "ethereum",
      }),
    ).toBe("ethereum:0x1111111111111111111111111111111111111111")
  })

  it("validates UPI and crypto required fields", () => {
    expect(validateStaticQrContent("upi", { vpa: "" })).toEqual({
      fieldErrors: { vpa: "Enter a UPI ID." },
      isValid: false,
    })
    expect(validateStaticQrContent("upi", { vpa: "not-a-vpa" })).toEqual({
      fieldErrors: { vpa: "Enter a valid UPI ID (name@bank)." },
      isValid: false,
    })
    expect(validateStaticQrContent("crypto", { address: "", asset: "bitcoin" })).toEqual({
      fieldErrors: { address: "Enter a wallet address." },
      isValid: false,
    })
  })
})
