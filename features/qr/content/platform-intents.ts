import type { QrInputType } from "@/features/qr/content/input-options"

export type { PlatformContentValues } from "@/features/qr/content/intents/shared"

import {
  isPositiveAmount,
  isValidPhone,
  isValidPlatformUrl,
  isValidUrl,
  platformUrlErrorMessage,
  VALIDATION_MESSAGES,
} from "@/features/qr/content/content-field-validation"
import {
  normalizeUrl,
  stringFieldValue,
} from "@/features/qr/content/platform-builders"
import { getIntentSampleValues } from "@/features/qr/content/platform-samples"
import { APP_PLATFORM_DEFS } from "@/features/qr/content/intents/apps"
import { BUSINESS_PLATFORM_DEFS } from "@/features/qr/content/intents/business"
import { DEVELOPER_PLATFORM_DEFS } from "@/features/qr/content/intents/developer"
import { LOCATION_PLATFORM_DEFS } from "@/features/qr/content/intents/location"
import { MESSAGING_PLATFORM_DEFS } from "@/features/qr/content/intents/messaging"
import { MUSIC_PLATFORM_DEFS } from "@/features/qr/content/intents/music"
import {
  type ContentCollectionId,
  type PlatformContentValues,
  type PlatformDef,
  type PlatformFieldDef,
  type PlatformIntentDef,
} from "@/features/qr/content/intents/shared"
import { SOCIAL_PLATFORM_DEFS } from "@/features/qr/content/intents/social"

export const PLATFORM_DEFS: readonly PlatformDef[] = [
  ...SOCIAL_PLATFORM_DEFS,
  ...MESSAGING_PLATFORM_DEFS,
  ...APP_PLATFORM_DEFS,
  ...MUSIC_PLATFORM_DEFS,
  ...LOCATION_PLATFORM_DEFS,
  ...BUSINESS_PLATFORM_DEFS,
  ...DEVELOPER_PLATFORM_DEFS,
] as const

const PLATFORM_DEF_BY_TYPE = new Map<QrInputType, PlatformDef>(
  PLATFORM_DEFS.map((def) => [def.type, def]),
)

const PLATFORM_TYPES = new Set<QrInputType>(PLATFORM_DEFS.map((def) => def.type))

const LEGACY_PLATFORM_ALIASES: Partial<Record<QrInputType, QrInputType>> = {
  "telegram-username": "telegram",
  "whatsapp-chat": "whatsapp",
  "app-download": "app-store",
  form: "google-forms",
  "booking-link": "calendly",
  "payment-link": "stripe",
}

export const URL_ONLY_ALIAS_TYPES = new Set<QrInputType>([
  "auto",
  "website",
  "app-download",
  "pdf",
  "image",
  "video",
  "document",
  "menu",
])

export function getPlatformDef(type: QrInputType): PlatformDef | undefined {
  const resolved = LEGACY_PLATFORM_ALIASES[type] ?? type
  return PLATFORM_DEF_BY_TYPE.get(resolved)
}

export function isPlatformType(type: QrInputType): boolean {
  return PLATFORM_TYPES.has(type) || type in LEGACY_PLATFORM_ALIASES
}

export function resolvePlatformType(type: QrInputType): QrInputType {
  return LEGACY_PLATFORM_ALIASES[type] ?? type
}

export function getDefaultIntentId(type: QrInputType): string {
  const def = getPlatformDef(type)
  if (!def) {
    return "url"
  }

  if (def.defaultIntentId) {
    return def.defaultIntentId
  }

  const preferredIds = [
    "profile",
    "channel",
    "user",
    "username",
    "invite",
    "blog",
    "publication",
    "track",
    "chat",
    "song",
    "url",
  ] as const

  for (const preferredId of preferredIds) {
    if (def.intents.some((intent) => intent.id === preferredId)) {
      return preferredId
    }
  }

  return def.intents[0]?.id ?? "url"
}

function getIntentDef(type: QrInputType, intentId: string): PlatformIntentDef | undefined {
  const def = getPlatformDef(type)
  return def?.intents.find((intent) => intent.id === intentId) ?? def?.intents[0]
}

export function getPlatformDefaultValues(type: QrInputType): PlatformContentValues {
  return getPlatformDefaultValuesForIntent(type)
}

export function getPlatformDefaultValuesForIntent(
  type: QrInputType,
  intentId?: string,
): PlatformContentValues {
  const resolved = resolvePlatformType(type)
  const def = getPlatformDef(resolved)
  if (!def) {
    return { url: "https://example.com" }
  }

  const intent = getIntentDef(resolved, intentId ?? getDefaultIntentId(resolved))
  const activeIntentId = intent?.id ?? getDefaultIntentId(resolved)
  const samples = getIntentSampleValues(resolved, activeIntentId)
  const values: PlatformContentValues = { intent: activeIntentId }

  for (const field of intent?.fields ?? []) {
    if (field.key === "hidden") {
      values.hidden = false
      continue
    }

    values[field.key] = samples[field.key] ?? ""
  }

  return values
}

export function buildPlatformPayload(
  type: QrInputType,
  values: PlatformContentValues,
): string {
  const resolved = resolvePlatformType(type)
  const intentId = stringFieldValue(values, "intent") || getDefaultIntentId(resolved)
  const intent = getIntentDef(resolved, intentId)
  if (!intent) {
    return normalizeUrl(stringFieldValue(values, "url"))
  }
  return intent.build(values)
}

export function validatePlatformContent(
  type: QrInputType,
  values: PlatformContentValues,
): Record<string, string> {
  const resolved = resolvePlatformType(type)
  const intentId = stringFieldValue(values, "intent") || getDefaultIntentId(resolved)
  const intent = getIntentDef(resolved, intentId)
  const fieldErrors: Record<string, string> = {}

  if (!intent) {
    if (!stringFieldValue(values, "url")) {
      fieldErrors.url = "Enter a URL."
    }
    return fieldErrors
  }

  const hasUrl = Boolean(stringFieldValue(values, "url"))

  for (const field of intent.fields) {
    if (field.required && !hasUrl && !stringFieldValue(values, field.key)) {
      fieldErrors[field.key] = `Enter ${field.label.toLowerCase()}.`
    }
  }

  if (intent.fields.length === 1 && intent.fields[0]?.key === "url" && !hasUrl) {
    fieldErrors.url = "Enter a URL."
  }

  validateMapLocationFields(resolved, values, fieldErrors)

  const def = getPlatformDef(resolved)

  for (const field of intent.fields) {
    validateFieldValue(field, values, def, intent, fieldErrors)
  }

  return fieldErrors
}

function validateMapLocationFields(
  resolved: QrInputType,
  values: PlatformContentValues,
  fieldErrors: Record<string, string>,
) {
  if (resolved !== "map-location") {
    return
  }

  const latitude = stringFieldValue(values, "latitude")
  const longitude = stringFieldValue(values, "longitude")

  if (!latitude && !longitude) {
    return
  }

  if (!isLatitude(latitude)) {
    fieldErrors.latitude = "Latitude must be between -90 and 90."
  }
  if (!isLongitude(longitude)) {
    fieldErrors.longitude = "Longitude must be between -180 and 180."
  }
}

function validateFieldValue(
  field: PlatformFieldDef,
  values: PlatformContentValues,
  def: PlatformDef | undefined,
  intent: PlatformIntentDef,
  fieldErrors: Record<string, string>,
) {
  const value = stringFieldValue(values, field.key)
  if (!value || fieldErrors[field.key]) {
    return
  }

  switch (field.kind) {
    case "url": {
      const hosts = def?.hosts ?? []
      const ok = hosts.length > 0 ? isValidPlatformUrl(value, hosts) : isValidUrl(value)
      if (!ok || (def && intent.matchPath && isWrongPlatformIntent(value, def, intent))) {
        fieldErrors[field.key] = platformUrlErrorMessage(intent.label)
      }
      break
    }
    case "phone":
      if (!isValidPhone(value)) {
        fieldErrors[field.key] = VALIDATION_MESSAGES.phone
      }
      break
    case "amount":
      if (!isPositiveAmount(value)) {
        fieldErrors[field.key] = VALIDATION_MESSAGES.amount
      }
      break
    default:
      break
  }
}

function isWrongPlatformIntent(
  value: string,
  def: PlatformDef,
  intent: PlatformIntentDef,
): boolean {
  try {
    const parsed = new URL(normalizeUrl(value))
    const pathname = parsed.pathname
    const params = parsed.searchParams
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")

    // Incomplete stubs / bare host still OK while typing.
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) {
      return false
    }

    if (intent.matchPath?.(pathname, params, hostname)) {
      return false
    }

    return def.intents.some(
      (other) =>
        other.id !== intent.id &&
        Boolean(other.matchPath?.(pathname, params, hostname)),
    )
  } catch {
    return false
  }
}

function isLatitude(value: string) {
  if (!value) {
    return false
  }
  const number = Number(value)
  return Number.isFinite(number) && number >= -90 && number <= 90
}

function isLongitude(value: string) {
  if (!value) {
    return false
  }
  const number = Number(value)
  return Number.isFinite(number) && number >= -180 && number <= 180
}

export function detectPlatformIntentFromUrl(
  input: string,
): { type: QrInputType; intent: string; platform?: string; brandIconId?: string } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  let parsed: URL
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    parsed = new URL(candidate)
  } catch {
    return null
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")
  const pathname = parsed.pathname
  const searchParams = parsed.searchParams

  for (const def of PLATFORM_DEFS) {
    if (def.hosts.length === 0) {
      continue
    }

    const hostMatched = def.hosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    )
    if (!hostMatched) {
      continue
    }

    if (def.matchHost && !def.matchHost(hostname, pathname)) {
      continue
    }

    if (def.type === "tiktok" && (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com")) {
      return {
        type: def.type,
        intent: "video",
        platform: def.type,
        brandIconId: def.brandIconId,
      }
    }

    if (def.type === "github" && hostname === "gist.github.com") {
      return {
        type: def.type,
        intent: "gist",
        platform: def.type,
        brandIconId: def.brandIconId,
      }
    }

    if (def.type === "twitch" && hostname === "clips.twitch.tv") {
      return {
        type: def.type,
        intent: "clip",
        platform: def.type,
        brandIconId: def.brandIconId,
      }
    }

    for (const intent of def.intents) {
      if (intent.matchPath?.(pathname, searchParams, hostname)) {
        return {
          type: def.type,
          intent: intent.id,
          platform: def.type,
          brandIconId: def.brandIconId,
        }
      }
    }

    const fallbackIntent =
      def.intents.find((intent) => intent.id === def.defaultIntentId) ??
      def.intents.find((intent) =>
        ["profile", "blog", "publication", "user", "channel", "username", "invite"].includes(
          intent.id,
        ),
      ) ??
      def.intents[def.intents.length - 1]!

    return {
      type: def.type,
      intent: fallbackIntent.id,
      platform: def.type,
      brandIconId: def.brandIconId,
    }
  }

  return null
}

export function extractPlatformValuesFromUrl(
  type: QrInputType,
  input: string,
): Partial<PlatformContentValues> | null {
  const detection = detectPlatformIntentFromUrl(input)
  if (!detection || detection.type !== resolvePlatformType(type)) {
    return null
  }

  const values: Partial<PlatformContentValues> = {
    intent: detection.intent,
    url: input.trim(),
  }

  return values
}

const CONTENT_COLLECTIONS: ReadonlyArray<{
  id: ContentCollectionId
  label: string
  types: readonly QrInputType[]
}> = [
  {
    id: "popular",
    label: "Essentials",
    types: ["link", "text", "phone", "email", "wifi", "vcard", "whatsapp"],
  },
  {
    id: "more",
    label: "More",
    types: ["sms", "map-location", "event", "coupon", "upi", "crypto"],
  },
]

export const PLATFORM_PICKER_TYPES: readonly QrInputType[] = [
  ...new Set(CONTENT_COLLECTIONS.flatMap((collection) => collection.types)),
]

function getIntentLabel(type: QrInputType, intentId: string): string {
  return getIntentDef(type, intentId)?.label ?? intentId
}
