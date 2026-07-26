import type { QrInputType } from "@/features/qr-code/content/input-options"

export type UrlDetectionCategory =
  | "app"
  | "booking"
  | "business"
  | "file"
  | "form"
  | "link"
  | "location"
  | "menu"
  | "payment"
  | "social"

export type UrlDetectionConfidence = "high" | "low"

export type UrlDetection = {
  brandIconId?: string
  category: UrlDetectionCategory
  confidence: UrlDetectionConfidence
  /** Legacy content type hint for icons, templates, and analytics. */
  inputTypeHint?: QrInputType
  platform?: string
}

export type PastedContentKind =
  | "email"
  | "link"
  | "map-location"
  | "phone"
  | "sms"
  | "text"
  | "vcard"
  | "wifi"

export type PastedContentDetection = {
  kind: PastedContentKind
  urlDetection?: UrlDetection
  value: string
}

type UrlRule = {
  brandIconId?: string
  category: UrlDetectionCategory
  confidence?: UrlDetectionConfidence
  hosts?: readonly string[]
  inputTypeHint?: QrInputType
  match?: (hostname: string, pathname: string) => boolean
  platform?: string
}

const HOST_RULES: readonly UrlRule[] = [
  {
    hosts: ["instagram.com"],
    platform: "instagram",
    category: "social",
    brandIconId: "instagram",
    inputTypeHint: "instagram",
  },
  {
    hosts: ["x.com", "twitter.com"],
    platform: "x",
    category: "social",
    brandIconId: "x",
    inputTypeHint: "x",
  },
  {
    hosts: ["tiktok.com"],
    platform: "tiktok",
    category: "social",
    brandIconId: "tiktok",
    inputTypeHint: "tiktok",
  },
  {
    hosts: ["youtube.com", "youtu.be", "music.youtube.com"],
    platform: "youtube",
    category: "social",
    brandIconId: "youtube",
    inputTypeHint: "youtube",
  },
  {
    hosts: ["linkedin.com"],
    platform: "linkedin",
    category: "social",
    inputTypeHint: "linkedin",
  },
  {
    hosts: ["facebook.com", "fb.com", "m.facebook.com"],
    platform: "facebook",
    category: "social",
    brandIconId: "facebook",
    inputTypeHint: "facebook",
  },
  {
    hosts: ["threads.net"],
    platform: "threads",
    category: "social",
    brandIconId: "threads",
    inputTypeHint: "threads",
  },
  {
    hosts: ["pinterest.com"],
    platform: "pinterest",
    category: "social",
    brandIconId: "pinterest",
    inputTypeHint: "pinterest",
  },
  {
    hosts: ["snapchat.com"],
    platform: "snapchat",
    category: "social",
    brandIconId: "snapchat",
    inputTypeHint: "snapchat",
  },
  {
    hosts: ["t.me", "telegram.me", "telegram.dog"],
    platform: "telegram",
    category: "social",
    brandIconId: "telegram",
    inputTypeHint: "telegram",
  },
  {
    hosts: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com"],
    platform: "whatsapp",
    category: "social",
    brandIconId: "whatsapp",
    inputTypeHint: "whatsapp-chat",
  },
  {
    match: (hostname, pathname) =>
      hostname === "discord.gg" ||
      (hostname === "discord.com" && pathname.startsWith("/invite")),
    platform: "discord",
    category: "social",
    brandIconId: "discord",
    inputTypeHint: "discord",
  },
  {
    match: (_, pathname) =>
      pathname.endsWith(".pdf") || pathname.includes("/pdf/"),
    platform: "pdf",
    category: "file",
    inputTypeHint: "pdf",
    confidence: "high",
  },
  {
    match: (_, pathname) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(pathname),
    platform: "image",
    category: "file",
    inputTypeHint: "image",
    confidence: "high",
  },
  {
    match: (_, pathname) => /\.(mp4|mov|webm|m4v)$/i.test(pathname),
    platform: "video",
    category: "file",
    inputTypeHint: "video",
    confidence: "high",
  },
  {
    hosts: ["forms.gle", "docs.google.com"],
    match: (hostname, pathname) =>
      hostname === "docs.google.com" ? pathname.startsWith("/forms/") : true,
    platform: "form",
    category: "form",
    inputTypeHint: "form",
  },
  {
    hosts: ["typeform.com", "jotform.com", "tally.so"],
    platform: "form",
    category: "form",
    inputTypeHint: "form",
  },
  {
    hosts: ["apps.apple.com", "play.google.com", "appstore.com"],
    platform: "app-download",
    category: "app",
    inputTypeHint: "app-download",
  },
  {
    hosts: ["maps.google.com", "maps.app.goo.gl", "goo.gl"],
    match: (hostname, pathname) =>
      hostname === "google.com" ? pathname.startsWith("/maps") : true,
    platform: "map-location",
    category: "location",
    brandIconId: "google-maps",
    inputTypeHint: "map-location",
  },
  {
    hosts: ["g.page", "business.google.com"],
    platform: "google-review",
    category: "business",
    inputTypeHint: "google-review",
    confidence: "low",
  },
  {
    hosts: ["calendly.com", "booking.com", "acuityscheduling.com"],
    platform: "booking-link",
    category: "booking",
    brandIconId: "calendly",
    inputTypeHint: "booking-link",
    confidence: "low",
  },
  {
    hosts: [
      "stripe.com",
      "checkout.stripe.com",
      "paypal.com",
      "paypal.me",
      "venmo.com",
      "cash.app",
      "square.link",
      "razorpay.com",
    ],
    platform: "payment-link",
    category: "payment",
    brandIconId: "stripe",
    inputTypeHint: "payment-link",
    confidence: "low",
  },
]

export function detectUrlKind(input: string): UrlDetection | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const parsed = parseHttpUrl(trimmed)
  if (!parsed) {
    return null
  }

  const hostname = normalizeHostname(parsed.hostname)
  const pathname = parsed.pathname

  for (const rule of HOST_RULES) {
    if (matchesUrlRule(rule, hostname, pathname)) {
      return toUrlDetection(rule)
    }
  }

  return {
    category: "link",
    confidence: "low",
    inputTypeHint: "link",
  }
}

export function detectPastedContent(input: string): PastedContentDetection | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const lower = trimmed.toLowerCase()

  if (lower.startsWith("wifi:")) {
    return { kind: "wifi", value: trimmed }
  }

  if (lower.startsWith("begin:vcard")) {
    return { kind: "vcard", value: trimmed }
  }

  if (lower.startsWith("tel:")) {
    return { kind: "phone", value: trimmed.slice(4) }
  }

  if (lower.startsWith("mailto:")) {
    return { kind: "email", value: trimmed.slice(7) }
  }

  if (lower.startsWith("sms:")) {
    return { kind: "sms", value: trimmed.slice(4) }
  }

  if (lower.startsWith("geo:")) {
    return {
      kind: "map-location",
      value: trimmed,
      urlDetection: {
        category: "location",
        confidence: "high",
        inputTypeHint: "map-location",
        platform: "map-location",
        brandIconId: "google-maps",
      },
    }
  }

  if (isBareEmail(trimmed)) {
    return { kind: "email", value: trimmed }
  }

  if (isBarePhone(trimmed)) {
    return { kind: "phone", value: trimmed }
  }

  if (looksLikeUrl(trimmed)) {
    const urlDetection = detectUrlKind(trimmed)
    return {
      kind: "link",
      value: trimmed,
      urlDetection: urlDetection ?? undefined,
    }
  }

  return { kind: "text", value: trimmed }
}

function matchesUrlRule(rule: UrlRule, hostname: string, pathname: string) {
  const hostMatched = rule.hosts
    ? rule.hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
    : true

  if (!hostMatched) {
    return false
  }

  if (rule.match) {
    return rule.match(hostname, pathname)
  }

  return Boolean(rule.hosts)
}

function toUrlDetection(rule: UrlRule): UrlDetection {
  return {
    brandIconId: rule.brandIconId,
    category: rule.category,
    confidence: rule.confidence ?? "high",
    inputTypeHint: rule.inputTypeHint,
    platform: rule.platform,
  }
}

function parseHttpUrl(input: string) {
  const candidate = looksLikeUrl(input) ? normalizeUrlForParsing(input) : null
  if (!candidate) {
    return null
  }

  try {
    return new URL(candidate)
  } catch {
    return null
  }
}

function normalizeUrlForParsing(input: string) {
  const trimmed = input.trim()
  if (/^[a-z][a-z\d+\-.]*:/i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^www\./, "")
}

function looksLikeUrl(input: string) {
  if (/^[a-z][a-z\d+\-.]*:/i.test(input)) {
    return /^https?:\/\//i.test(input)
  }

  return input.includes(".") && !input.includes(" ")
}

function isBareEmail(input: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
}

function isBarePhone(input: string) {
  const digits = input.replace(/\D/g, "")
  return digits.length >= 7 && digits.length <= 15 && /^[+()\d\s.-]+$/.test(input)
}
