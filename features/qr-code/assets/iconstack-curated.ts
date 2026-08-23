import {
  ICONSTACK_LIBRARIES,
  type IconstackLibraryId,
  type IconstackSearchResult,
} from "@/features/qr-code/assets/iconstack-api"

export type IconstackCuratedIcon = {
  id: string
  label: string
  library: IconstackLibraryId
}

export const ICONSTACK_CURATED_ICONS = [
  { library: "lucide", id: "link", label: "Link" },
  { library: "lucide", id: "qr-code", label: "QR Code" },
  { library: "lucide", id: "mail", label: "Mail" },
  { library: "lucide", id: "phone", label: "Phone" },
  { library: "lucide", id: "map-pin", label: "Location" },
  { library: "lucide", id: "share-2", label: "Share" },
  { library: "tabler", id: "world", label: "Website" },
  { library: "tabler", id: "brand-whatsapp", label: "WhatsApp" },
  { library: "tabler", id: "wifi", label: "Wi-Fi" },
  { library: "tabler", id: "calendar-event", label: "Event" },
  { library: "simple", id: "github", label: "GitHub" },
  { library: "simple", id: "instagram", label: "Instagram" },
  { library: "simple", id: "youtube", label: "YouTube" },
  { library: "simple", id: "spotify", label: "Spotify" },
  { library: "heroicons", id: "shopping-bag-solid", label: "Shop" },
  { library: "heroicons", id: "credit-card-solid", label: "Payment" },
  { library: "phosphor", id: "ticket-bold-bold", label: "Ticket" },
  { library: "phosphor", id: "identification-card-bold-bold", label: "Contact" },
  { library: "carbon", id: "restaurant", label: "Menu" },
  { library: "material", id: "offer", label: "Coupon" },
] as const satisfies readonly IconstackCuratedIcon[]

const ICONSTACK_LIBRARY_LABELS = new Map(
  ICONSTACK_LIBRARIES.map((library) => [library.id, library.label]),
)

export function filterCuratedIconstackIcons(library: IconstackLibraryId | "all") {
  if (library === "all") {
    return ICONSTACK_CURATED_ICONS
  }

  return ICONSTACK_CURATED_ICONS.filter((icon) => icon.library === library)
}

export function toCuratedSearchResult(icon: IconstackCuratedIcon): IconstackSearchResult {
  return {
    category: null,
    id: `${icon.library}-${icon.id}`,
    library: icon.library,
    libraryName: ICONSTACK_LIBRARY_LABELS.get(icon.library) ?? icon.library,
    name: icon.label,
    style: "outline",
    tags: [],
    url: `https://iconstack.io/icon/${icon.library}/${icon.id}`,
  }
}
