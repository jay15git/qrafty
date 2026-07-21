import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import { buildTemplateDocumentSeed } from "@/features/studio-hub/model/bootstrap-document"

export type QrDesignTemplateCategory =
  | "business"
  | "social"
  | "minimal"
  | "bold"
  | "event"
  | "retail"

export type QrDesignTemplate = {
  id: string
  title: string
  subtitle: string
  category: QrDesignTemplateCategory
  tags: string[]
  thumbnailUrl: string
  accentColor: string
  document: DraftingWorkspaceDocumentV1
  featured?: boolean
}

function templateThumbnail(hue: number, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 35% 18%)"/><stop offset="1" stop-color="hsl(${hue} 28% 32%)"/></linearGradient></defs><rect fill="url(#g)" width="400" height="400"/><rect x="108" y="108" width="184" height="184" rx="20" fill="${accent}" fill-opacity="0.15"/><rect x="128" y="128" width="144" height="144" rx="12" fill="white" fill-opacity="0.95"/><rect x="148" y="148" width="32" height="32" rx="6" fill="${accent}"/><rect x="220" y="148" width="32" height="32" rx="6" fill="${accent}"/><rect x="148" y="220" width="32" height="32" rx="6" fill="${accent}"/><rect x="188" y="188" width="24" height="24" rx="4" fill="${accent}" fill-opacity="0.7"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const TEMPLATE_SEEDS: Omit<QrDesignTemplate, "document">[] = [
  {
    id: "minimal-ink",
    title: "Minimal Ink",
    subtitle: "Clean monochrome for any link",
    category: "minimal",
    tags: ["Link", "Minimal"],
    thumbnailUrl: templateThumbnail(220, "#111827"),
    accentColor: "#111827",
    featured: true,
  },
  {
    id: "ocean-gradient",
    title: "Ocean Gradient",
    subtitle: "Soft blue gradient card",
    category: "minimal",
    tags: ["Link", "Gradient"],
    thumbnailUrl: templateThumbnail(210, "#2563eb"),
    accentColor: "#2563eb",
    featured: true,
  },
  {
    id: "neon-pulse",
    title: "Neon Pulse",
    subtitle: "Animated dot matrix overlay",
    category: "bold",
    tags: ["Link", "Motion"],
    thumbnailUrl: templateThumbnail(280, "#a855f7"),
    accentColor: "#a855f7",
    featured: true,
  },
  {
    id: "business-card",
    title: "Business Card",
    subtitle: "Professional vCard layout",
    category: "business",
    tags: ["vCard", "Contact"],
    thumbnailUrl: templateThumbnail(215, "#0f766e"),
    accentColor: "#0f766e",
  },
  {
    id: "wifi-lounge",
    title: "WiFi Lounge",
    subtitle: "Guest network QR",
    category: "retail",
    tags: ["WiFi", "Hospitality"],
    thumbnailUrl: templateThumbnail(35, "#ea580c"),
    accentColor: "#ea580c",
  },
  {
    id: "instagram-glow",
    title: "Instagram Glow",
    subtitle: "Social profile with warm gradient",
    category: "social",
    tags: ["Instagram", "Social"],
    thumbnailUrl: templateThumbnail(330, "#db2777"),
    accentColor: "#db2777",
  },
  {
    id: "event-ticket",
    title: "Event Ticket",
    subtitle: "Bold corners for event check-in",
    category: "event",
    tags: ["Event", "Ticket"],
    thumbnailUrl: templateThumbnail(25, "#dc2626"),
    accentColor: "#dc2626",
  },
  {
    id: "menu-bistro",
    title: "Menu Bistro",
    subtitle: "Restaurant menu link",
    category: "retail",
    tags: ["Menu", "Food"],
    thumbnailUrl: templateThumbnail(45, "#92400e"),
    accentColor: "#92400e",
  },
  {
    id: "linkedin-pro",
    title: "LinkedIn Pro",
    subtitle: "Corporate networking profile",
    category: "business",
    tags: ["LinkedIn", "Business"],
    thumbnailUrl: templateThumbnail(215, "#0a66c2"),
    accentColor: "#0a66c2",
  },
  {
    id: "sunset-social",
    title: "Sunset Social",
    subtitle: "Warm gradient for creators",
    category: "social",
    tags: ["Link", "Creator"],
    thumbnailUrl: templateThumbnail(15, "#f97316"),
    accentColor: "#f97316",
  },
  {
    id: "retail-sale",
    title: "Retail Sale",
    subtitle: "High-contrast promo QR",
    category: "retail",
    tags: ["Promo", "Retail"],
    thumbnailUrl: templateThumbnail(350, "#be123c"),
    accentColor: "#be123c",
  },
  {
    id: "bold-blocks",
    title: "Bold Blocks",
    subtitle: "Square modules with strong frame",
    category: "bold",
    tags: ["Link", "Bold"],
    thumbnailUrl: templateThumbnail(260, "#4f46e5"),
    accentColor: "#4f46e5",
  },
]

function buildDocuments(): QrDesignTemplate[] {
  const documents: Record<string, DraftingWorkspaceDocumentV1> = {
    "minimal-ink": buildTemplateDocumentSeed({
      inputType: "link",
      data: "https://example.com",
      contentValues: { url: "https://example.com" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "square", color: "#111827", roundSize: false },
        finderPatternOuterSettings: { type: "square", color: "#111827" },
        finderPatternInnerSettings: { type: "square", color: "#111827" },
        backgroundOptions: { color: "#ffffff", round: 0, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#ffffff",
        cornerRadius: 16,
        border: { color: "#e5e7eb", opacity: 100, width: 1 },
      }),
    }),
    "ocean-gradient": buildTemplateDocumentSeed({
      inputType: "link",
      data: "https://example.com",
      contentValues: { url: "https://example.com" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "rounded", color: "#1e3a8a", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#1e40af" },
        finderPatternInnerSettings: { type: "circle", color: "#2563eb" },
        backgroundOptions: { color: "#eff6ff", round: 12, transparent: false },
        dataModulesGradient: {
          enabled: true,
          type: "linear",
          rotation: 135,
          colorStops: [
            { offset: 0, color: "#2563eb" },
            { offset: 1, color: "#67e8f9" },
          ],
        },
        dotsColorMode: "gradient",
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#dbeafe",
        cornerRadius: 24,
      }),
    }),
    "neon-pulse": buildTemplateDocumentSeed({
      inputType: "link",
      data: "https://example.com",
      contentValues: { url: "https://example.com" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "rounded", color: "#a855f7", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#7c3aed" },
        finderPatternInnerSettings: { type: "circle", color: "#c084fc" },
        backgroundOptions: { color: "#0f0a1a", round: 16, transparent: false },
        dotMatrixAnimation: {
          ...base.dotMatrixAnimation,
          enabled: true,
          animated: true,
          colorPreset: "neon",
        },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#1e1033",
        cornerRadius: 20,
      }),
    }),
    "business-card": buildTemplateDocumentSeed({
      inputType: "vcard",
      data: "BEGIN:VCARD\nVERSION:3.0\nFN:Alex Morgan\nEND:VCARD",
      contentValues: {
        firstName: "Alex",
        lastName: "Morgan",
        email: "alex@studio.local",
        phone: "+1 555 0100",
        organization: "New QR Studio",
      },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "rounded", color: "#0f766e", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#115e59" },
        finderPatternInnerSettings: { type: "circle", color: "#14b8a6" },
        backgroundOptions: { color: "#f0fdfa", round: 8, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#ecfdf5",
        cornerRadius: 12,
        border: { color: "#99f6e4", opacity: 100, width: 2 },
      }),
    }),
    "wifi-lounge": buildTemplateDocumentSeed({
      inputType: "wifi",
      data: "WIFI:T:WPA;S:GuestNetwork;P:welcome123;;",
      contentValues: {
        ssid: "GuestNetwork",
        password: "welcome123",
        encryption: "WPA",
      },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "rounded", color: "#c2410c", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#ea580c" },
        finderPatternInnerSettings: { type: "circle", color: "#fb923c" },
        backgroundOptions: { color: "#fff7ed", round: 16, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#ffedd5",
        cornerRadius: 20,
      }),
    }),
    "instagram-glow": buildTemplateDocumentSeed({
      inputType: "instagram",
      data: "https://instagram.com/studio",
      contentValues: { username: "studio" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "heart", color: "#be185d", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#db2777" },
        finderPatternInnerSettings: { type: "circle", color: "#f472b6" },
        backgroundOptions: { color: "#fdf2f8", round: 20, transparent: false },
        dataModulesGradient: {
          enabled: true,
          type: "linear",
          rotation: 45,
          colorStops: [
            { offset: 0, color: "#db2777" },
            { offset: 1, color: "#f97316" },
          ],
        },
        dotsColorMode: "gradient",
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#fce7f3",
        cornerRadius: 28,
      }),
    }),
    "event-ticket": buildTemplateDocumentSeed({
      inputType: "event",
      data: "https://tickets.example.com/gala",
      contentValues: {
        title: "Annual Gala",
        location: "Grand Hall",
        startDate: "2026-06-01",
      },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "square", color: "#991b1b", roundSize: false },
        finderPatternOuterSettings: { type: "square", color: "#dc2626" },
        finderPatternInnerSettings: { type: "square", color: "#ef4444" },
        backgroundOptions: { color: "#fef2f2", round: 4, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#fee2e2",
        cornerRadius: 8,
        border: { color: "#dc2626", opacity: 100, width: 3 },
      }),
    }),
    "menu-bistro": buildTemplateDocumentSeed({
      inputType: "menu",
      data: "https://menu.bistro.local",
      contentValues: { url: "https://menu.bistro.local" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "rounded", color: "#78350f", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#92400e" },
        finderPatternInnerSettings: { type: "circle", color: "#b45309" },
        backgroundOptions: { color: "#fffbeb", round: 12, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#fef3c7",
        cornerRadius: 16,
      }),
    }),
    "linkedin-pro": buildTemplateDocumentSeed({
      inputType: "linkedin",
      data: "https://linkedin.com/in/alex",
      contentValues: { username: "alex" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "rounded", color: "#0a66c2", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#004182" },
        finderPatternInnerSettings: { type: "circle", color: "#378fe9" },
        backgroundOptions: { color: "#f8fafc", round: 8, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#e0f2fe",
        cornerRadius: 12,
      }),
    }),
    "sunset-social": buildTemplateDocumentSeed({
      inputType: "link",
      data: "https://creator.example.com",
      contentValues: { url: "https://creator.example.com" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "leaf", color: "#ea580c", roundSize: true },
        finderPatternOuterSettings: { type: "rounded-lg", color: "#f97316" },
        finderPatternInnerSettings: { type: "circle", color: "#fdba74" },
        backgroundOptions: { color: "#fff7ed", round: 24, transparent: false },
        backgroundGradient: {
          enabled: true,
          type: "linear",
          rotation: 160,
          colorStops: [
            { offset: 0, color: "#fff7ed" },
            { offset: 1, color: "#fed7aa" },
          ],
        },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#ffedd5",
        cornerRadius: 24,
      }),
    }),
    "retail-sale": buildTemplateDocumentSeed({
      inputType: "link",
      data: "https://shop.example.com/sale",
      contentValues: { url: "https://shop.example.com/sale" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "square", color: "#be123c", roundSize: false },
        finderPatternOuterSettings: { type: "square", color: "#9f1239" },
        finderPatternInnerSettings: { type: "square", color: "#e11d48" },
        backgroundOptions: { color: "#ffffff", round: 0, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#ffe4e6",
        cornerRadius: 4,
        border: { color: "#be123c", opacity: 100, width: 4 },
      }),
    }),
    "bold-blocks": buildTemplateDocumentSeed({
      inputType: "link",
      data: "https://example.com",
      contentValues: { url: "https://example.com" },
      qr: (base) => ({
        ...base,
        dataModulesSettings: { type: "square", color: "#4f46e5", roundSize: false },
        finderPatternOuterSettings: { type: "square", color: "#3730a3" },
        finderPatternInnerSettings: { type: "square", color: "#6366f1" },
        backgroundOptions: { color: "#eef2ff", round: 0, transparent: false },
      }),
      card: (base) => ({
        ...base,
        enabled: true,
        fill: "#e0e7ff",
        cornerRadius: 0,
        border: { color: "#4f46e5", opacity: 100, width: 6 },
      }),
    }),
  }

  return TEMPLATE_SEEDS.map((seed) => ({
    ...seed,
    document: documents[seed.id]!,
  }))
}

export const QR_DESIGN_TEMPLATES: QrDesignTemplate[] = buildDocuments()

export const TEMPLATE_CATEGORIES: Array<{
  id: QrDesignTemplateCategory | "all"
  label: string
}> = [
  { id: "all", label: "All" },
  { id: "business", label: "Business" },
  { id: "social", label: "Social" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
  { id: "event", label: "Event" },
  { id: "retail", label: "Retail" },
]

export function getTemplateById(id: string): QrDesignTemplate | undefined {
  return QR_DESIGN_TEMPLATES.find((template) => template.id === id)
}

export function getFeaturedTemplates(): QrDesignTemplate[] {
  return QR_DESIGN_TEMPLATES.filter((template) => template.featured)
}
