import {
  isPositiveAmount,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  VALIDATION_MESSAGES,
} from "@/features/qr-code/content/content-field-validation"
import type { QrInputType } from "@/features/qr-code/content/input-options"
import { normalizeContentTypeForPicker } from "@/features/qr-code/content/input-options"
import {
  buildPlatformPayload,
  extractPlatformValuesFromUrl,
  getPlatformDefaultValues,
  getPlatformDefaultValuesForIntent,
  isPlatformType,
  PLATFORM_DEFS,
  resolvePlatformType,
  validatePlatformContent,
} from "@/features/qr-code/content/platform-intents"

export type StaticQrContentValue = string | boolean
export type StaticQrContentValues = Record<string, StaticQrContentValue | undefined>

export type StaticQrValidationResult = {
  fieldErrors: Record<string, string>
  isValid: boolean
}

type LinkFieldKey = "url" | "username"

type StaticQrContentMeta = {
  description: string
  primaryField: LinkFieldKey | "text" | "phone" | "email" | "ssid" | "firstName" | "code" | "vpa" | "address"
  title: string
}

const STRUCTURED_STATIC_QR_CONTENT_META = {
  auto: {
    description: "Paste any static value. URLs, text, and QR URI schemes are encoded as-is.",
    primaryField: "text",
    title: "Auto",
  },
  text: {
    description: "Plain text that opens in the scanner result.",
    primaryField: "text",
    title: "Text",
  },
  link: {
    description: "A static website or landing page URL.",
    primaryField: "url",
    title: "Link",
  },
  website: {
    description: "A static website URL.",
    primaryField: "url",
    title: "Website",
  },
  phone: {
    description: "Tap-to-call phone number.",
    primaryField: "phone",
    title: "Phone",
  },
  email: {
    description: "A prefilled email draft.",
    primaryField: "email",
    title: "Email",
  },
  sms: {
    description: "Tap-to-message phone number with optional body.",
    primaryField: "phone",
    title: "SMS",
  },
  wifi: {
    description: "Network name, security type, password, and hidden network flag.",
    primaryField: "ssid",
    title: "Wi-Fi",
  },
  vcard: {
    description: "A static contact card scanners can save.",
    primaryField: "firstName",
    title: "vCard",
  },
  "whatsapp-chat": {
    description: "WhatsApp phone number with optional message.",
    primaryField: "phone",
    title: "WhatsApp Chat",
  },
  "telegram-username": {
    description: "Telegram username or channel.",
    primaryField: "username",
    title: "Telegram Username",
  },
  "app-download": {
    description: "App Store, Play Store, or universal app URL.",
    primaryField: "url",
    title: "App Download",
  },
  event: {
    description: "Event URL by default, or a static calendar payload.",
    primaryField: "url",
    title: "Event",
  },
  coupon: {
    description: "Coupon code, short description, and optional URL.",
    primaryField: "code",
    title: "Coupon",
  },
  upi: {
    description: "UPI payment request for GPay, PhonePe, Paytm, and BHIM.",
    primaryField: "vpa",
    title: "UPI",
  },
  crypto: {
    description: "Cryptocurrency payment URI with optional amount.",
    primaryField: "address",
    title: "Crypto",
  },
} satisfies Partial<Record<QrInputType, StaticQrContentMeta>>

function buildPlatformContentMeta(): Partial<Record<QrInputType, StaticQrContentMeta>> {
  const meta: Partial<Record<QrInputType, StaticQrContentMeta>> = {}

  for (const def of PLATFORM_DEFS) {
    const primaryKey = def.intents[0]?.fields[0]?.key ?? "url"
    meta[def.type] = {
      description: def.description,
      primaryField: primaryKey as StaticQrContentMeta["primaryField"],
      title: def.label,
    }
  }

  return meta
}

export const STATIC_QR_CONTENT_META: Record<QrInputType, StaticQrContentMeta> = {
  ...STRUCTURED_STATIC_QR_CONTENT_META,
  ...buildPlatformContentMeta(),
} as Record<QrInputType, StaticQrContentMeta>

const LINK_CONTENT_TYPES = new Set<QrInputType>([
  "link",
  "website",
  "app-download",
])

export function getDefaultStaticQrValues(type: QrInputType): StaticQrContentValues {
  if (type === "auto") {
    return { text: "https://new-qr-studio.local/launch" }
  }

  if (isPlatformType(type)) {
    return getPlatformDefaultValues(resolvePlatformType(type))
  }

  if (type === "text") {
    return { text: "" }
  }

  if (type === "link") {
    return { url: "https://" }
  }

  if (type === "wifi") {
    return {
      hidden: false,
      password: "",
      security: "WPA",
      ssid: "",
    }
  }

  if (type === "email") {
    return { body: "", email: "", subject: "" }
  }

  if (type === "phone") {
    return { phone: "" }
  }

  if (type === "sms") {
    return { message: "", phone: "" }
  }

  if (type === "vcard") {
    return {
      company: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      title: "",
      url: "",
    }
  }

  if (type === "whatsapp" || type === "whatsapp-chat") {
    return getPlatformDefaultValues("whatsapp")
  }

  if (type === "map-location") {
    return getPlatformDefaultValues("map-location")
  }

  if (type === "event") {
    return {
      description: "",
      end: "",
      eventMode: "url",
      location: "",
      start: "",
      title: "",
      url: "",
    }
  }

  if (type === "coupon") {
    return { code: "", description: "", url: "" }
  }

  if (type === "upi") {
    return {
      amount: "",
      currency: "INR",
      note: "",
      payeeName: "",
      vpa: "",
    }
  }

  if (type === "crypto") {
    return {
      address: "",
      amount: "",
      asset: "bitcoin",
    }
  }

  return { url: "" }
}

export function getContentValuesForTypeChange(
  fromType: QrInputType,
  toType: QrInputType,
  fromValues: StaticQrContentValues,
): StaticQrContentValues {
  const defaults = getDefaultStaticQrValues(toType)
  const normalizedFrom = normalizeContentTypeForPicker(fromType)
  const normalizedTo = normalizeContentTypeForPicker(toType)

  if (normalizedFrom === "link" && normalizedTo === "link") {
    const url = stringValue(fromValues.url) || stringValue(fromValues.username)

    if (url) {
      return { ...defaults, url }
    }
  }

  if (normalizedFrom === "text" && normalizedTo === "link") {
    const text = stringValue(fromValues.text)

    if (text) {
      return { ...defaults, url: text }
    }
  }

  if (normalizedFrom === "link" && normalizedTo === "text") {
    const url = stringValue(fromValues.url) || stringValue(fromValues.username)

    if (url) {
      return { ...defaults, text: url }
    }
  }

  if (normalizedFrom === "link" && normalizedTo !== "link" && normalizedTo !== "text") {
    const url = stringValue(fromValues.url) || stringValue(fromValues.username)
    if (url && isPlatformType(toType)) {
      const extracted = extractPlatformValuesFromUrl(toType, url)
      if (extracted) {
        return { ...defaults, ...extracted }
      }
    }
  }

  if (normalizedTo === "link" && normalizedFrom !== "link" && normalizedFrom !== "text") {
    const url = stringValue(fromValues.url) || stringValue(fromValues.username)
    if (url) {
      return { ...getDefaultStaticQrValues("link"), url }
    }
  }

  return defaults
}

export function resolveContentValuesForType(
  type: QrInputType,
  existing?: StaticQrContentValues,
): StaticQrContentValues {
  if (!existing) {
    return getDefaultStaticQrValues(type)
  }

  const defaults = isPlatformType(type)
    ? getPlatformDefaultValuesForIntent(
        type,
        stringValue(existing.intent) || undefined,
      )
    : getDefaultStaticQrValues(type)

  const merged: StaticQrContentValues = { ...defaults }

  for (const [key, value] of Object.entries(existing)) {
    if (value === undefined) {
      continue
    }

    const defaultValue = defaults[key]
    if (
      typeof value === "string" &&
      value.trim() === "" &&
      typeof defaultValue === "string" &&
      defaultValue.trim() !== ""
    ) {
      continue
    }

    merged[key] = value
  }

  return merged
}

export function buildStaticQrPayload(
  type: QrInputType,
  values: StaticQrContentValues,
): string {
  if (isPlatformType(type)) {
    return buildPlatformPayload(type, values)
  }

  switch (type) {
    case "auto":
    case "text":
      return stringValue(values.text)
    case "link":
    case "website":
    case "app-download":
      return normalizeUrl(stringValue(values.url))
    case "phone":
      return `tel:${normalizePhone(stringValue(values.phone))}`
    case "email":
      return buildMailtoPayload(values)
    case "sms":
      return buildSmsPayload(values)
    case "wifi":
      return buildWifiPayload(values)
    case "vcard":
      return buildVCardPayload(values)
    case "whatsapp":
    case "whatsapp-chat":
      return buildWhatsAppPayload(values)
    case "event":
      return buildEventPayload(values)
    case "coupon":
      return buildCouponPayload(values)
    case "upi":
      return buildUpiPayload(values)
    case "crypto":
      return buildCryptoPayload(values)
  }
}

export function validateStaticQrContent(
  type: QrInputType,
  values: StaticQrContentValues,
): StaticQrValidationResult {
  if (isPlatformType(type)) {
    const fieldErrors = validatePlatformContent(type, values)
    return {
      fieldErrors,
      isValid: Object.keys(fieldErrors).length === 0,
    }
  }

  const fieldErrors: Record<string, string> = {}

  if (type === "wifi" && !stringValue(values.ssid)) {
    fieldErrors.ssid = "Enter a network name."
  }

  if (LINK_CONTENT_TYPES.has(type) && !stringValue(values.url)) {
    fieldErrors.url = "Enter a URL."
  }

  if (type === "phone" && !stringValue(values.phone)) {
    fieldErrors.phone = "Enter a phone number."
  }

  if (type === "email" && !stringValue(values.email)) {
    fieldErrors.email = "Enter an email address."
  }

  if ((type === "sms") && !stringValue(values.phone)) {
    fieldErrors.phone = "Enter a phone number."
  }

  if (type === "vcard") {
    const hasContactValue = [
      values.firstName,
      values.lastName,
      values.phone,
      values.email,
      values.company,
    ].some((value) => Boolean(stringValue(value)))

    if (!hasContactValue) {
      fieldErrors.firstName = "Add a name, phone, or email."
    }
  }

  if (type === "event") {
    const eventMode = stringValue(values.eventMode) || "url"

    if (eventMode === "url" && !stringValue(values.url)) {
      fieldErrors.url = "Enter an event URL."
    }

    if (eventMode === "calendar") {
      if (!stringValue(values.title)) {
        fieldErrors.title = "Enter an event title."
      }

      if (!stringValue(values.start)) {
        fieldErrors.start = "Enter a start date and time."
      }
    }
  }

  if (type === "coupon" && !stringValue(values.code) && !stringValue(values.url)) {
    fieldErrors.code = "Enter a coupon code or URL."
  }

  if (type === "upi") {
    const vpa = stringValue(values.vpa)
    if (!vpa) {
      fieldErrors.vpa = "Enter a UPI ID."
    } else if (!isValidUpiVpa(vpa)) {
      fieldErrors.vpa = "Enter a valid UPI ID (name@bank)."
    }

    const amount = stringValue(values.amount)
    if (amount && !isPositiveAmount(amount)) {
      fieldErrors.amount = VALIDATION_MESSAGES.amount
    }
  }

  if (type === "crypto") {
    if (!stringValue(values.address)) {
      fieldErrors.address = "Enter a wallet address."
    }

    const amount = stringValue(values.amount)
    if (amount && !isPositiveAmount(amount)) {
      fieldErrors.amount = VALIDATION_MESSAGES.amount
    }
  }

  const url = stringValue(values.url)
  if (url && !fieldErrors.url) {
    const eventMode = stringValue(values.eventMode) || "url"
    const shouldValidateUrl =
      LINK_CONTENT_TYPES.has(type) ||
      (type === "event" && eventMode === "url") ||
      type === "vcard" ||
      (type === "coupon" && !stringValue(values.code))

    if (shouldValidateUrl && !isValidUrl(url)) {
      fieldErrors.url = VALIDATION_MESSAGES.url
    }
  }

  const email = stringValue(values.email)
  if (email && !fieldErrors.email && (type === "email" || type === "vcard") && !isValidEmail(email)) {
    fieldErrors.email = VALIDATION_MESSAGES.email
  }

  const phone = stringValue(values.phone)
  if (phone && !fieldErrors.phone && (type === "phone" || type === "sms" || type === "vcard") && !isValidPhone(phone)) {
    fieldErrors.phone = VALIDATION_MESSAGES.phone
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  }
}

function buildMailtoPayload(values: StaticQrContentValues) {
  const email = stringValue(values.email)
  const query = toQueryString({
    subject: stringValue(values.subject),
    body: stringValue(values.body),
  })

  return query ? `mailto:${email}?${query}` : `mailto:${email}`
}

function buildSmsPayload(values: StaticQrContentValues) {
  const phone = normalizePhone(stringValue(values.phone))
  const message = stringValue(values.message)

  return message ? `sms:${phone}?body=${encodeURIComponent(message)}` : `sms:${phone}`
}

function buildWifiPayload(values: StaticQrContentValues) {
  const security = stringValue(values.security) || "WPA"
  const ssid = escapeWifiValue(stringValue(values.ssid))
  const password = escapeWifiValue(stringValue(values.password))
  const hidden = Boolean(values.hidden)

  return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? "true" : "false"};;`
}

function buildVCardPayload(values: StaticQrContentValues) {
  const firstName = stringValue(values.firstName)
  const lastName = stringValue(values.lastName)
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(fullName || stringValue(values.company) || stringValue(values.email) || stringValue(values.phone))}`,
  ]

  appendVCardLine(lines, "ORG", values.company)
  appendVCardLine(lines, "TITLE", values.title)

  const phone = normalizePhone(stringValue(values.phone))
  if (phone) {
    lines.push(`TEL:${phone}`)
  }

  appendVCardLine(lines, "EMAIL", values.email)
  appendVCardLine(lines, "URL", normalizeUrl(stringValue(values.url)))
  lines.push("END:VCARD")

  return lines.join("\n")
}

function buildWhatsAppPayload(values: StaticQrContentValues) {
  const phone = normalizePhone(stringValue(values.phone)).replace(/^\+/, "")
  const message = stringValue(values.message)

  return message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`
}

function buildEventPayload(values: StaticQrContentValues) {
  const eventMode = stringValue(values.eventMode) || "url"

  if (eventMode !== "calendar") {
    return normalizeUrl(stringValue(values.url))
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeCalendarValue(stringValue(values.title))}`,
    `DTSTART:${formatCalendarDateTime(stringValue(values.start))}`,
  ]

  const end = stringValue(values.end)
  if (end) {
    lines.push(`DTEND:${formatCalendarDateTime(end)}`)
  }

  appendCalendarLine(lines, "LOCATION", values.location)
  appendCalendarLine(lines, "DESCRIPTION", values.description)
  lines.push("END:VEVENT", "END:VCALENDAR")

  return lines.join("\n")
}

function buildCouponPayload(values: StaticQrContentValues) {
  return [
    stringValue(values.code),
    stringValue(values.description),
    normalizeUrl(stringValue(values.url)),
  ]
    .filter(Boolean)
    .join("\n")
}

function buildUpiPayload(values: StaticQrContentValues) {
  const query = toQueryString({
    pa: stringValue(values.vpa),
    pn: stringValue(values.payeeName),
    am: stringValue(values.amount),
    cu: stringValue(values.currency) || "INR",
    tn: stringValue(values.note),
  })

  return `upi://pay?${query}`
}

const CRYPTO_ASSET_SCHEMES: Record<string, string> = {
  bitcoin: "bitcoin",
  bitcoincash: "bitcoincash",
  dash: "dash",
  ethereum: "ethereum",
  litecoin: "litecoin",
}

function buildCryptoPayload(values: StaticQrContentValues) {
  const asset = stringValue(values.asset) || "bitcoin"
  const scheme = CRYPTO_ASSET_SCHEMES[asset] ?? "bitcoin"
  const address = stringValue(values.address)
  const amount = stringValue(values.amount)

  if (!amount) {
    return `${scheme}:${address}`
  }

  return `${scheme}:${address}?amount=${encodeURIComponent(amount)}`
}

function isValidUpiVpa(value: string) {
  return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(value)
}

function appendVCardLine(
  lines: string[],
  label: string,
  value: StaticQrContentValue | undefined,
) {
  const text = stringValue(value)

  if (text) {
    lines.push(`${label}:${escapeVCardValue(text)}`)
  }
}

function appendCalendarLine(
  lines: string[],
  label: string,
  value: StaticQrContentValue | undefined,
) {
  const text = stringValue(value)

  if (text) {
    lines.push(`${label}:${escapeCalendarValue(text)}`)
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  if (/^[a-z][a-z\d+\-.]*:/i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

function normalizePhone(value: string) {
  const trimmed = value.trim()
  const hasPlus = trimmed.startsWith("+")
  const digits = trimmed.replace(/\D/g, "")

  return hasPlus && digits ? `+${digits}` : digits
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1")
}

function escapeVCardValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function escapeCalendarValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function formatCalendarDateTime(value: string) {
  const compact = value.replace(/[-:]/g, "").replace(/\.\d+$/, "")

  if (/T\d{4}$/.test(compact)) {
    return `${compact}00`
  }

  return compact
}

function isNumberInRange(value: string, min: number, max: number) {
  if (!value) {
    return false
  }

  const number = Number(value)
  return Number.isFinite(number) && number >= min && number <= max
}

function stringValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

function toQueryString(values: Record<string, string>) {
  return Object.entries(values)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")
}
