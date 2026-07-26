import type { QrInputType } from "@/features/qr-code/content/input-options"
import { normalizeContentTypeForPicker } from "@/features/qr-code/content/input-options"

export type StaticQrContentValue = string | boolean
export type StaticQrContentValues = Record<string, StaticQrContentValue | undefined>

export type StaticQrValidationResult = {
  fieldErrors: Record<string, string>
  isValid: boolean
}

type LinkFieldKey = "url" | "username"

type StaticQrContentMeta = {
  description: string
  primaryField: LinkFieldKey | "text" | "phone" | "email" | "ssid" | "firstName" | "code"
  title: string
}

export const STATIC_QR_CONTENT_META: Record<QrInputType, StaticQrContentMeta> = {
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
  instagram: {
    description: "Instagram profile URL or username.",
    primaryField: "username",
    title: "Instagram",
  },
  whatsapp: {
    description: "WhatsApp chat link with optional message.",
    primaryField: "phone",
    title: "WhatsApp",
  },
  wifi: {
    description: "Network name, security type, password, and hidden network flag.",
    primaryField: "ssid",
    title: "Wi-Fi",
  },
  facebook: {
    description: "Facebook page or profile URL.",
    primaryField: "url",
    title: "Facebook",
  },
  x: {
    description: "X profile URL or username.",
    primaryField: "username",
    title: "X",
  },
  tiktok: {
    description: "TikTok profile URL or username.",
    primaryField: "username",
    title: "TikTok",
  },
  youtube: {
    description: "YouTube channel, video, or handle URL.",
    primaryField: "url",
    title: "YouTube",
  },
  linkedin: {
    description: "LinkedIn profile or company URL.",
    primaryField: "url",
    title: "LinkedIn",
  },
  telegram: {
    description: "Telegram profile or channel username.",
    primaryField: "username",
    title: "Telegram",
  },
  snapchat: {
    description: "Snapchat username.",
    primaryField: "username",
    title: "Snapchat",
  },
  threads: {
    description: "Threads profile URL or username.",
    primaryField: "username",
    title: "Threads",
  },
  pinterest: {
    description: "Pinterest profile URL or username.",
    primaryField: "username",
    title: "Pinterest",
  },
  discord: {
    description: "Discord invite URL.",
    primaryField: "url",
    title: "Discord",
  },
  sms: {
    description: "Tap-to-message phone number with optional body.",
    primaryField: "phone",
    title: "SMS",
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
  "map-location": {
    description: "Coordinates or a search query for a place.",
    primaryField: "url",
    title: "Map Location",
  },
  "google-review": {
    description: "Google review or business profile URL.",
    primaryField: "url",
    title: "Google Review",
  },
  "booking-link": {
    description: "Booking, reservation, or calendar URL.",
    primaryField: "url",
    title: "Booking Link",
  },
  "payment-link": {
    description: "Payment checkout URL.",
    primaryField: "url",
    title: "Payment Link",
  },
  menu: {
    description: "Menu URL for restaurants, events, or venues.",
    primaryField: "url",
    title: "Menu",
  },
  "app-download": {
    description: "App Store, Play Store, or universal app URL.",
    primaryField: "url",
    title: "App Download",
  },
  pdf: {
    description: "Static hosted PDF URL.",
    primaryField: "url",
    title: "PDF",
  },
  image: {
    description: "Static hosted image URL.",
    primaryField: "url",
    title: "Image",
  },
  video: {
    description: "Static hosted video URL.",
    primaryField: "url",
    title: "Video",
  },
  document: {
    description: "Static hosted document URL.",
    primaryField: "url",
    title: "Document",
  },
  form: {
    description: "Static form URL.",
    primaryField: "url",
    title: "Form",
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
}

const LINK_CONTENT_TYPES = new Set<QrInputType>([
  "link",
  "website",
  "facebook",
  "youtube",
  "linkedin",
  "discord",
  "google-review",
  "booking-link",
  "payment-link",
  "menu",
  "app-download",
  "pdf",
  "image",
  "video",
  "document",
  "form",
])

const SOCIAL_USERNAME_BUILDERS: Partial<Record<QrInputType, (username: string) => string>> = {
  instagram: (username) => `https://instagram.com/${username}`,
  pinterest: (username) => `https://pinterest.com/${username}`,
  snapchat: (username) => `https://snapchat.com/add/${username}`,
  telegram: (username) => `https://t.me/${username}`,
  "telegram-username": (username) => `https://t.me/${username}`,
  threads: (username) => `https://threads.net/@${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
  x: (username) => `https://x.com/${username}`,
}

export function getDefaultStaticQrValues(type: QrInputType): StaticQrContentValues {
  if (type === "auto") {
    return { text: "https://new-qr-studio.local/launch" }
  }

  if (type === "text") {
    return { text: "Hello from New QR" }
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
    return { message: "", phone: "" }
  }

  if (type === "map-location") {
    return { latitude: "", longitude: "", query: "" }
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

  if (SOCIAL_USERNAME_BUILDERS[type]) {
    return { username: "" }
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

  return defaults
}

export function buildStaticQrPayload(
  type: QrInputType,
  values: StaticQrContentValues,
): string {
  switch (type) {
    case "auto":
    case "text":
      return stringValue(values.text)
    case "link":
    case "website":
    case "facebook":
    case "youtube":
    case "linkedin":
    case "discord":
    case "google-review":
    case "booking-link":
    case "payment-link":
    case "menu":
    case "app-download":
    case "pdf":
    case "image":
    case "video":
    case "document":
    case "form":
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
    case "telegram":
    case "telegram-username":
    case "instagram":
    case "pinterest":
    case "snapchat":
    case "threads":
    case "tiktok":
    case "x":
      return buildUsernameOrUrlPayload(type, values)
    case "map-location":
      return buildMapPayload(values)
    case "event":
      return buildEventPayload(values)
    case "coupon":
      return buildCouponPayload(values)
  }
}

export function validateStaticQrContent(
  type: QrInputType,
  values: StaticQrContentValues,
): StaticQrValidationResult {
  const fieldErrors: Record<string, string> = {}

  if (type === "wifi" && !stringValue(values.ssid)) {
    fieldErrors.ssid = "Enter a network name."
  }

  if (LINK_CONTENT_TYPES.has(type) && !stringValue(values.url)) {
    fieldErrors.url = "Enter a URL."
  }

  if (
    SOCIAL_USERNAME_BUILDERS[type] &&
    !stringValue(values.username) &&
    !stringValue(values.url)
  ) {
    fieldErrors.username = "Enter a username."
  }

  if (type === "phone" && !stringValue(values.phone)) {
    fieldErrors.phone = "Enter a phone number."
  }

  if (type === "email" && !stringValue(values.email)) {
    fieldErrors.email = "Enter an email address."
  }

  if ((type === "sms" || type === "whatsapp" || type === "whatsapp-chat") && !stringValue(values.phone)) {
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

  if (type === "map-location") {
    const latitude = stringValue(values.latitude)
    const longitude = stringValue(values.longitude)

    if (!latitude && !longitude && !stringValue(values.query)) {
      fieldErrors.query = "Enter a place or coordinates."
    }

    if (latitude || longitude) {
      if (!isNumberInRange(latitude, -90, 90)) {
        fieldErrors.latitude = "Latitude must be between -90 and 90."
      }

      if (!isNumberInRange(longitude, -180, 180)) {
        fieldErrors.longitude = "Longitude must be between -180 and 180."
      }
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

function buildUsernameOrUrlPayload(type: QrInputType, values: StaticQrContentValues) {
  const url = stringValue(values.url)

  if (url) {
    return normalizeUrl(url)
  }

  const username = normalizeUsername(stringValue(values.username))
  const builder = SOCIAL_USERNAME_BUILDERS[type]

  return builder ? builder(username) : username
}

function buildMapPayload(values: StaticQrContentValues) {
  const latitude = stringValue(values.latitude)
  const longitude = stringValue(values.longitude)
  const query = stringValue(values.query)

  if (latitude || longitude) {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : ""
    return `geo:${latitude},${longitude}${suffix}`
  }

  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
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

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "").replace(/^\/+/, "")
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
