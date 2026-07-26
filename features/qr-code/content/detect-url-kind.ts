import type { QrInputType } from "@/features/qr-code/content/input-options"
import {
  detectPlatformIntentFromUrl,
  getPlatformDef,
  type PlatformDef,
} from "@/features/qr-code/content/platform-intents"

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
  intent?: string
  /** Legacy content type hint for icons, templates, and analytics. */
  inputTypeHint?: QrInputType
  platform?: string
}

export type PastedContentKind =
  | "crypto"
  | "email"
  | "link"
  | "map-location"
  | "phone"
  | "sms"
  | "text"
  | "upi"
  | "vcard"
  | "wifi"

export type PastedContentDetection = {
  kind: PastedContentKind
  urlDetection?: UrlDetection
  value: string
}

function mapPlatformCategory(category: PlatformDef["category"]): UrlDetectionCategory {
  switch (category) {
    case "app":
      return "app"
    case "business":
      return "business"
    case "file":
      return "file"
    case "location":
      return "location"
    case "messaging":
    case "music":
    case "social":
      return "social"
    case "developer":
      return "link"
    default:
      return "link"
  }
}

export function detectUrlKind(input: string): UrlDetection | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  const parsed = parseHttpUrl(trimmed)
  if (!parsed) {
    return null
  }

  const platformDetection = detectPlatformIntentFromUrl(trimmed)
  if (platformDetection) {
    const def = getPlatformDef(platformDetection.type)
    return {
      brandIconId: platformDetection.brandIconId ?? def?.brandIconId,
      category: def ? mapPlatformCategory(def.category) : "social",
      confidence: "high",
      intent: platformDetection.intent,
      inputTypeHint: platformDetection.type,
      platform: platformDetection.platform ?? platformDetection.type,
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

  if (lower.startsWith("upi:")) {
    return { kind: "upi", value: trimmed }
  }

  if (
    lower.startsWith("bitcoin:") ||
    lower.startsWith("ethereum:") ||
    lower.startsWith("litecoin:") ||
    lower.startsWith("bitcoincash:") ||
    lower.startsWith("dash:")
  ) {
    return { kind: "crypto", value: trimmed }
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
        intent: "coords",
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
