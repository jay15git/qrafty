import type { IconType } from "react-icons";
import {
  SiBehance,
  SiBookingdotcom,
  SiCalendly,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGithub,
  SiGooglemaps,
  SiInstagram,
  SiLine,
  SiMedium,
  SiNetflix,
  SiPaypal,
  SiPinterest,
  SiRazorpay,
  SiReddit,
  SiShopify,
  SiSignal,
  SiSlack,
  SiSnapchat,
  SiSpotify,
  SiSquare,
  SiStripe,
  SiSubstack,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";

export type BrandIconEntry = {
  icon: IconType;
  id: string;
  label: string;
};

export const BRAND_ICON_CATALOG = [
  {
    id: "instagram",
    label: "Instagram",
    icon: SiInstagram,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: SiWhatsapp,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: SiFacebook,
  },
  {
    id: "threads",
    label: "Threads",
    icon: SiThreads,
  },
  {
    id: "x",
    label: "X",
    icon: SiX,
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: SiTiktok,
  },
  {
    id: "signal",
    label: "Signal",
    icon: SiSignal,
  },
  {
    id: "netflix",
    label: "Netflix",
    icon: SiNetflix,
  },
  {
    id: "slack",
    label: "Slack",
    icon: SiSlack,
  },

  {
    id: "youtube",
    label: "YouTube",
    icon: SiYoutube,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: SiTelegram,
  },
  {
    id: "snapchat",
    label: "Snapchat",
    icon: SiSnapchat,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    icon: SiPinterest,
  },
  {
    id: "discord",
    label: "Discord",
    icon: SiDiscord,
  },
  {
    id: "reddit",
    label: "Reddit",
    icon: SiReddit,
  },
  {
    id: "twitch",
    label: "Twitch",
    icon: SiTwitch,
  },
  {
    id: "substack",
    label: "Substack",
    icon: SiSubstack,
  },
  {
    id: "medium",
    label: "Medium",
    icon: SiMedium,
  },
  {
    id: "behance",
    label: "Behance",
    icon: SiBehance,
  },
  {
    id: "dribbble",
    label: "Dribbble",
    icon: SiDribbble,
  },
  {
    id: "line",
    label: "Line",
    icon: SiLine,
  },
  {
    id: "calendly",
    label: "Calendly",
    icon: SiCalendly,
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: SiPaypal,
  },
  {
    id: "stripe",
    label: "Stripe",
    icon: SiStripe,
  },
  {
    id: "razorpay",
    label: "Razorpay",
    icon: SiRazorpay,
  },
  {
    id: "square",
    label: "Square",
    icon: SiSquare,
  },
  {
    id: "shopify",
    label: "Shopify",
    icon: SiShopify,
  },
  {
    id: "google-maps",
    label: "Google Maps",
    icon: SiGooglemaps,
  },
  {
    id: "booking-com",
    label: "Booking.com",
    icon: SiBookingdotcom,
  },
  {
    id: "spotify",
    label: "Spotify",
    icon: SiSpotify,
  },
  {
    id: "github",
    label: "GitHub",
    icon: SiGithub,
  },
] as const satisfies readonly BrandIconEntry[];

export type BrandIconId = (typeof BRAND_ICON_CATALOG)[number]["id"];

export const POPULAR_BRAND_ICON_IDS = [
  "whatsapp",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "telegram",
  "spotify",
  "paypal",
  "google-maps",
  "shopify",
  "github",
] as const satisfies readonly BrandIconId[];

const BRAND_ICON_BY_ID = new Map<string, BrandIconEntry>(
  BRAND_ICON_CATALOG.map((entry) => [entry.id, entry]),
);

export function findBrandIconById(id?: string) {
  if (!id) {
    return undefined;
  }

  return BRAND_ICON_BY_ID.get(id);
}

export function getBrandIconById(id: BrandIconId) {
  const brandIcon = findBrandIconById(id);

  if (!brandIcon) {
    throw new Error(`Unknown brand icon: ${id}`);
  }

  return brandIcon;
}
