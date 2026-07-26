import type { LucideIcon } from "lucide-react"
import {
  AppWindow,
  AtSign,
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
  Bitcoin,
  IndianRupee,
  TicketPercent,
  Type,
  Users,
  Wifi,
  Link2,
  Mail,
  MapPinned,
  Video,
} from "lucide-react"

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

export type QuickQrInputType =
  | "text"
  | "link"
  | "phone"
  | "email"
  | "instagram"
  | "whatsapp"

export type QrCategoryKey = "popular" | "contact" | "more"

/** Types shown in content pickers. URL-only aliases + legacy auto still exist for saved docs. */
export const PICKER_QR_INPUT_TYPES = [
  "link",
  "text",
  "phone",
  "email",
  "sms",
  "wifi",
  "vcard",
  "whatsapp-chat",
  "telegram-username",
  "map-location",
  "event",
  "coupon",
  "upi",
  "crypto",
] as const satisfies readonly QrInputType[]

export type PickerQrInputType = (typeof PICKER_QR_INPUT_TYPES)[number]

const LINK_ALIAS_QR_INPUT_TYPES = new Set<QrInputType>([
  "website",
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
  "facebook",
  "instagram",
  "whatsapp",
  "x",
  "tiktok",
  "youtube",
  "linkedin",
  "telegram",
  "snapchat",
  "threads",
  "pinterest",
  "discord",
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

  if (LINK_ALIAS_QR_INPUT_TYPES.has(type)) {
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

  if (LINK_ALIAS_QR_INPUT_TYPES.has(type)) {
    return QR_INPUT_OPTIONS.link.label
  }

  return QR_INPUT_OPTIONS[type]?.label ?? QR_INPUT_OPTIONS.link.label
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
    label: "Map Location",
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
    label: "Booking Link",
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
      "whatsapp-chat",
      "telegram-username",
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
