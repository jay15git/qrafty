import type { LucideIcon } from "lucide-react"
import {
  AppWindow,
  AtSign,
  Bitcoin,
  BotMessageSquare,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  ContactRound,
  CreditCard,
  FileImage,
  FileText,
  FileVideoCamera,
  Ghost,
  Globe,
  Headphones,
  IndianRupee,
  Link2,
  Mail,
  MapPinned,
  MessageCircleMore,
  MessageSquareText,
  Music2,
  NotebookPen,
  NotebookText,
  Phone,
  Pin,
  QrCode,
  ScanText,
  Send,
  Sparkles,
  Star,
  Store,
  TicketPercent,
  Type,
  Users,
  Video,
  Wifi,
} from "lucide-react"

import {
  PLATFORM_PICKER_TYPES,
  URL_ONLY_ALIAS_TYPES,
  getPlatformDef,
  isPlatformType,
  resolvePlatformType,
} from "@/features/qr-code/content/platform-intents"

export type QrInputType =
  | "auto"
  | "text"
  | "link"
  | "phone"
  | "email"
  | "instagram"
  | "whatsapp"
  | "wifi"
  | "facebook"
  | "x"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "telegram"
  | "snapchat"
  | "threads"
  | "pinterest"
  | "discord"
  | "sms"
  | "vcard"
  | "whatsapp-chat"
  | "telegram-username"
  | "map-location"
  | "website"
  | "google-review"
  | "booking-link"
  | "payment-link"
  | "menu"
  | "app-download"
  | "pdf"
  | "image"
  | "video"
  | "document"
  | "form"
  | "event"
  | "coupon"
  | "upi"
  | "crypto"
  | "reddit"
  | "twitch"
  | "bluesky"
  | "mastodon"
  | "tumblr"
  | "messenger"
  | "signal"
  | "line"
  | "skype"
  | "app-store"
  | "play-store"
  | "microsoft-store"
  | "amazon-appstore"
  | "huawei-appgallery"
  | "spotify"
  | "apple-music"
  | "soundcloud"
  | "youtube-music"
  | "deezer"
  | "apple-maps"
  | "waze"
  | "calendly"
  | "paypal-me"
  | "venmo"
  | "cash-app"
  | "zoom"
  | "google-meet"
  | "microsoft-teams"
  | "github"
  | "gitlab"
  | "notion"
  | "medium"
  | "substack"

export type QuickQrInputType =
  | "text"
  | "link"
  | "phone"
  | "email"
  | "instagram"
  | "whatsapp"

export type QrCategoryKey = "popular" | "contact" | "more"

const STRUCTURED_PICKER_TYPES = [
  "link",
  "text",
  "phone",
  "email",
  "sms",
  "wifi",
  "vcard",
  "map-location",
  "event",
  "coupon",
  "upi",
  "crypto",
] as const satisfies readonly QrInputType[]

/** Types shown in content pickers. Legacy aliases still exist for saved docs. */
export const PICKER_QR_INPUT_TYPES = [
  ...STRUCTURED_PICKER_TYPES,
  ...PLATFORM_PICKER_TYPES.filter(
    (type) => !(STRUCTURED_PICKER_TYPES as readonly QrInputType[]).includes(type),
  ),
] as const satisfies readonly QrInputType[]

export type PickerQrInputType = (typeof PICKER_QR_INPUT_TYPES)[number]

const LINK_ALIAS_QR_INPUT_TYPES = new Set<QrInputType>([
  "website",
  "app-download",
  "whatsapp-chat",
  "telegram-username",
])

export function isPickerQrInputType(type: QrInputType): type is PickerQrInputType {
  return (PICKER_QR_INPUT_TYPES as readonly QrInputType[]).includes(type)
}

export function normalizeContentTypeForPicker(type: QrInputType): PickerQrInputType {
  if (isPickerQrInputType(type)) {
    return type
  }

  if (type === "auto") {
    return "text"
  }

  const resolved = resolvePlatformType(type)
  if (isPickerQrInputType(resolved)) {
    return resolved
  }

  if (LINK_ALIAS_QR_INPUT_TYPES.has(type) || URL_ONLY_ALIAS_TYPES.has(type)) {
    return "link"
  }

  return "link"
}

export function getContentTypeLabel(type: QrInputType): string {
  if (isPickerQrInputType(type)) {
    return QR_INPUT_OPTIONS[type].label
  }

  if (type === "auto") {
    return QR_INPUT_OPTIONS.text.label
  }

  const platform = getPlatformDef(type)
  if (platform) {
    return platform.label
  }

  if (LINK_ALIAS_QR_INPUT_TYPES.has(type)) {
    return QR_INPUT_OPTIONS.link.label
  }

  return QR_INPUT_OPTIONS[type as QrInputType]?.label ?? QR_INPUT_OPTIONS.link.label
}

export type QrInputOption = {
  icon: LucideIcon
  label: string
  value: QrInputType
}

type QuickQrInputOption = Omit<QrInputOption, "value"> & {
  value: QuickQrInputType
}

export type QrCategory = {
  icon: LucideIcon
  items: readonly QrInputOption[]
  key: QrCategoryKey
  label: string
}

export const DEFAULT_QR_INPUT_TYPE: QrInputType = "link"

export const QR_INPUT_OPTIONS: Record<QrInputType, QrInputOption> = {
  auto: { value: "auto", label: "Auto", icon: Sparkles },
  text: { value: "text", label: "Text", icon: Type },
  link: { value: "link", label: "Link", icon: Link2 },
  phone: { value: "phone", label: "Phone", icon: Phone },
  email: { value: "email", label: "Email", icon: Mail },
  instagram: { value: "instagram", label: "Instagram", icon: AtSign },
  whatsapp: { value: "whatsapp", label: "WhatsApp", icon: MessageCircleMore },
  wifi: { value: "wifi", label: "Wi-Fi", icon: Wifi },
  facebook: { value: "facebook", label: "Facebook", icon: Users },
  x: { value: "x", label: "X", icon: ScanText },
  tiktok: { value: "tiktok", label: "TikTok", icon: Music2 },
  youtube: { value: "youtube", label: "YouTube", icon: Video },
  linkedin: { value: "linkedin", label: "LinkedIn", icon: BriefcaseBusiness },
  telegram: { value: "telegram", label: "Telegram", icon: Send },
  snapchat: { value: "snapchat", label: "Snapchat", icon: Ghost },
  threads: { value: "threads", label: "Threads", icon: MessageSquareText },
  pinterest: { value: "pinterest", label: "Pinterest", icon: Pin },
  discord: { value: "discord", label: "Discord", icon: BotMessageSquare },
  sms: { value: "sms", label: "SMS", icon: MessageSquareText },
  vcard: { value: "vcard", label: "vCard", icon: ContactRound },
  "whatsapp-chat": {
    value: "whatsapp-chat",
    label: "WhatsApp Chat",
    icon: MessageCircleMore,
  },
  "telegram-username": {
    value: "telegram-username",
    label: "Telegram Username",
    icon: Send,
  },
  "map-location": {
    value: "map-location",
    label: "Google Maps",
    icon: MapPinned,
  },
  website: { value: "website", label: "Website", icon: Globe },
  "google-review": {
    value: "google-review",
    label: "Google Review",
    icon: Star,
  },
  "booking-link": {
    value: "booking-link",
    label: "Booking",
    icon: CalendarDays,
  },
  "payment-link": {
    value: "payment-link",
    label: "Payment Link",
    icon: CreditCard,
  },
  menu: { value: "menu", label: "Menu", icon: NotebookText },
  "app-download": {
    value: "app-download",
    label: "App Download",
    icon: AppWindow,
  },
  pdf: { value: "pdf", label: "PDF", icon: FileText },
  image: { value: "image", label: "Image", icon: FileImage },
  video: { value: "video", label: "Video", icon: FileVideoCamera },
  document: { value: "document", label: "Document", icon: FileText },
  form: { value: "form", label: "Form", icon: NotebookPen },
  event: { value: "event", label: "Event", icon: CalendarRange },
  coupon: { value: "coupon", label: "Coupon", icon: TicketPercent },
  upi: { value: "upi", label: "UPI", icon: IndianRupee },
  crypto: { value: "crypto", label: "Crypto", icon: Bitcoin },
  reddit: { value: "reddit", label: "Reddit", icon: MessageSquareText },
  twitch: { value: "twitch", label: "Twitch", icon: Video },
  bluesky: { value: "bluesky", label: "Bluesky", icon: AtSign },
  mastodon: { value: "mastodon", label: "Mastodon", icon: AtSign },
  tumblr: { value: "tumblr", label: "Tumblr", icon: Type },
  messenger: { value: "messenger", label: "Messenger", icon: MessageCircleMore },
  signal: { value: "signal", label: "Signal", icon: MessageSquareText },
  line: { value: "line", label: "Line", icon: MessageCircleMore },
  skype: { value: "skype", label: "Skype", icon: Phone },
  "app-store": { value: "app-store", label: "App Store", icon: AppWindow },
  "play-store": { value: "play-store", label: "Play Store", icon: Store },
  "microsoft-store": { value: "microsoft-store", label: "Microsoft Store", icon: AppWindow },
  "amazon-appstore": { value: "amazon-appstore", label: "Amazon Appstore", icon: Store },
  "huawei-appgallery": { value: "huawei-appgallery", label: "Huawei AppGallery", icon: AppWindow },
  spotify: { value: "spotify", label: "Spotify", icon: Headphones },
  "apple-music": { value: "apple-music", label: "Apple Music", icon: Music2 },
  soundcloud: { value: "soundcloud", label: "SoundCloud", icon: Headphones },
  "youtube-music": { value: "youtube-music", label: "YouTube Music", icon: Music2 },
  deezer: { value: "deezer", label: "Deezer", icon: Headphones },
  "apple-maps": { value: "apple-maps", label: "Apple Maps", icon: MapPinned },
  waze: { value: "waze", label: "Waze", icon: MapPinned },
  calendly: { value: "calendly", label: "Calendly", icon: CalendarDays },
  "paypal-me": { value: "paypal-me", label: "PayPal.me", icon: CreditCard },
  venmo: { value: "venmo", label: "Venmo", icon: CreditCard },
  "cash-app": { value: "cash-app", label: "Cash App", icon: CreditCard },
  zoom: { value: "zoom", label: "Zoom", icon: Video },
  "google-meet": { value: "google-meet", label: "Google Meet", icon: Video },
  "microsoft-teams": { value: "microsoft-teams", label: "Microsoft Teams", icon: Video },
  github: { value: "github", label: "GitHub", icon: Globe },
  gitlab: { value: "gitlab", label: "GitLab", icon: Globe },
  notion: { value: "notion", label: "Notion", icon: NotebookText },
  medium: { value: "medium", label: "Medium", icon: Type },
  substack: { value: "substack", label: "Substack", icon: NotebookPen },
}

const QUICK_INPUT_VALUES = [
  "link",
  "text",
  "phone",
  "email",
  "whatsapp",
] as const satisfies readonly QuickQrInputType[]

function pickQrInputOptions<const T extends readonly QrInputType[]>(values: T) {
  return values.map((value) => QR_INPUT_OPTIONS[value])
}

export const QUICK_INPUT_OPTIONS = pickQrInputOptions(
  QUICK_INPUT_VALUES
) as readonly QuickQrInputOption[]

export const QR_CATEGORIES: readonly QrCategory[] = [
  {
    key: "popular",
    label: "Popular",
    icon: QrCode,
    items: pickQrInputOptions([
      "link",
      "text",
      "phone",
      "email",
      "wifi",
      "vcard",
      "whatsapp",
      "instagram",
      "youtube",
    ]),
  },
  {
    key: "contact",
    label: "Contact",
    icon: ContactRound,
    items: pickQrInputOptions([
      "phone",
      "sms",
      "email",
      "vcard",
      "whatsapp",
      "telegram",
      "map-location",
    ]),
  },
  {
    key: "more",
    label: "More",
    icon: CalendarRange,
    items: pickQrInputOptions(["event", "coupon", "upi", "crypto"]),
  },
] as const

export function getNextOpenQrCategory(
  current: QrCategoryKey | null,
  next: QrCategoryKey
): QrCategoryKey | null {
  return current === next ? null : next
}

export function toggleQuickInputType(
  current: QrInputType | null,
  next: QuickQrInputType
): QrInputType | null {
  return current === next ? null : next
}

export function isPlatformContentType(type: QrInputType): boolean {
  return isPlatformType(type)
}
