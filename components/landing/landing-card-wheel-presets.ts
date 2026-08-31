import type { QraftyGradient } from "@/features/qr-code/model/state"
import type { QraftyDataModulesStyle } from "@/features/qr-code/model/state"
import type { QrFinderPatternInnerStyle, QrFinderPatternOuterStyle } from "@/features/qr-code/model/types"
import type { QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes"

type BrandShape = {
  id: Exclude<QrBackgroundShapeId, "none">
  fill: string
  padding: number
}

type BrandLogo = {
  color?: string
  gradient?: QraftyGradient
}

export type LandingWheelCardPreset = {
  id: string
  brandId: string
  url: string
  logo: BrandLogo
  qrSize: number
  shape: BrandShape
  module: QraftyDataModulesStyle
  finderInner: QrFinderPatternInnerStyle
  finderOuter: QrFinderPatternOuterStyle
  palette: [string, string, string, string]
}

function qraftyGradient(
  rotationDeg: number,
  from: string,
  to: string,
): QraftyGradient {
  return {
    enabled: true,
    type: "linear",
    rotation: (rotationDeg * Math.PI) / 180,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  }
}

/** Four tones from one family — light → mid → deep → anchor. */
function family(
  light: string,
  mid: string,
  deep: string,
  anchor: string,
): [string, string, string, string] {
  return [light, mid, deep, anchor]
}

function brand(
  id: string,
  brandId: string,
  url: string,
  logo: BrandLogo,
  palette: [string, string, string, string],
  module: QraftyDataModulesStyle,
  finderInner: QrFinderPatternInnerStyle,
  finderOuter: QrFinderPatternOuterStyle,
  shape: BrandShape,
  qrSize = 168,
): LandingWheelCardPreset {
  return {
    id,
    brandId,
    url,
    logo,
    qrSize,
    shape,
    module,
    finderInner,
    finderOuter,
    palette,
  }
}

/** Brand wheel — analogous pattern palettes matched to shape washes. */
export const LANDING_WHEEL_CARD_PRESETS: LandingWheelCardPreset[] = [
  brand(
    "instagram",
    "instagram",
    "https://instagram.com",
    { gradient: qraftyGradient(48, "#E1306C", "#F77737") },
    family("#F9A8D4", "#E1306C", "#C13584", "#F77737"),
    "rounded",
    "rounded",
    "rounded-lg",
    { id: "rounded-square", fill: "#FDF2F8", padding: 16 },
  ),
  brand(
    "whatsapp",
    "whatsapp",
    "https://wa.me",
    { color: "#25D366" },
    family("#6EE7B7", "#34D399", "#25D366", "#047857"),
    "leaf",
    "leaf",
    "rounded",
    { id: "blob", fill: "#ECFDF5", padding: 18 },
  ),
  brand(
    "signal",
    "signal",
    "https://signal.org",
    { gradient: qraftyGradient(132, "#60A5FA", "#2563EB") },
    family("#93C5FD", "#60A5FA", "#3B82F6", "#1D4ED8"),
    "rounded",
    "circle",
    "circle",
    { id: "circle", fill: "#E0F2FE", padding: 14 },
  ),
  brand(
    "snapchat",
    "snapchat",
    "https://snapchat.com",
    { color: "#713F12" },
    family("#FDE047", "#FACC15", "#CA8A04", "#713F12"),
    "circle",
    "circle",
    "rounded-lg",
    { id: "ghost", fill: "#FEF9C3", padding: 24 },
  ),
  brand(
    "github",
    "github",
    "https://github.com",
    { color: "#24292F" },
    family("#9CA3AF", "#6B7280", "#374151", "#24292F"),
    "square",
    "square",
    "square",
    { id: "octagon-flat", fill: "#F1F5F9", padding: 18 },
  ),
  brand(
    "spotify",
    "spotify",
    "https://spotify.com",
    { color: "#1DB954" },
    family("#86EFAC", "#4ADE80", "#1DB954", "#14532D"),
    "circle",
    "circle",
    "circle",
    { id: "circle", fill: "#D1FAE5", padding: 14 },
  ),
  brand(
    "youtube",
    "youtube",
    "https://youtube.com",
    { color: "#DC2626" },
    family("#FCA5A5", "#EF4444", "#DC2626", "#991B1B"),
    "rounded",
    "rounded",
    "rounded-lg",
    { id: "skew-card", fill: "#FEE2E2", padding: 20 },
  ),
  brand(
    "tiktok",
    "tiktok",
    "https://tiktok.com",
    { gradient: qraftyGradient(135, "#25F4EE", "#FE2C55") },
    family("#5EEAD4", "#2DD4BF", "#14B8A6", "#0F766E"),
    "rounded",
    "rounded",
    "rounded",
    { id: "diamond", fill: "#ECFEFF", padding: 20 },
  ),
  brand(
    "discord",
    "discord",
    "https://discord.com",
    { color: "#5865F2" },
    family("#A5B4FC", "#818CF8", "#5865F2", "#4338CA"),
    "rounded",
    "rounded",
    "rounded-lg",
    { id: "squircle-octagon", fill: "#EEF2FF", padding: 18 },
  ),
  brand(
    "x",
    "x",
    "https://x.com",
    { color: "#0F0F0F" },
    family("#D4D4D4", "#A3A3A3", "#525252", "#0F0F0F"),
    "square",
    "square",
    "square",
    { id: "rounded-square", fill: "#F4F4F5", padding: 16 },
  ),
  brand(
    "telegram",
    "telegram",
    "https://t.me",
    { color: "#229ED9" },
    family("#7DD3FC", "#38BDF8", "#229ED9", "#0369A1"),
    "circle",
    "circle",
    "circle",
    { id: "propeller", fill: "#E0F7FA", padding: 20 },
  ),
  brand(
    "pinterest",
    "pinterest",
    "https://pinterest.com",
    { color: "#BE123C" },
    family("#FDA4AF", "#F43F5E", "#BE123C", "#881337"),
    "heart",
    "heart",
    "rounded",
    { id: "heart", fill: "#FFF1F2", padding: 22 },
  ),
  brand(
    "reddit",
    "reddit",
    "https://reddit.com",
    { color: "#EA580C" },
    family("#FDBA74", "#FB923C", "#EA580C", "#9A3412"),
    "circle",
    "circle",
    "circle",
    { id: "burst-star", fill: "#FFEDD5", padding: 22 },
  ),
  brand(
    "facebook",
    "facebook",
    "https://fb.com",
    { color: "#1877F2" },
    family("#93C5FD", "#60A5FA", "#2563EB", "#1D4ED8"),
    "rounded",
    "rounded",
    "rounded-lg",
    { id: "arch", fill: "#EFF6FF", padding: 18 },
  ),
  brand(
    "netflix",
    "netflix",
    "https://netflix.com",
    { color: "#E50914" },
    family("#FCA5A5", "#EF4444", "#E50914", "#7F1D1D"),
    "square",
    "square",
    "square",
    { id: "skew-card", fill: "#FEE2E2", padding: 20 },
  ),
  brand(
    "slack",
    "slack",
    "https://slack.com",
    { gradient: qraftyGradient(118, "#9B6B9E", "#611F69") },
    family("#D8B4E2", "#A855F7", "#7C3AED", "#4C1D95"),
    "rounded",
    "rounded",
    "rounded-lg",
    { id: "four-lobes", fill: "#FAF5FF", padding: 20 },
  ),
]
