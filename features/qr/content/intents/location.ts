import type { PlatformDef } from "@/features/qr/content/intents/shared";

export const LOCATION_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "map-location",
    label: "Google Maps",
    category: "location",
    hosts: ["maps.google.com", "maps.app.goo.gl"],
    brandIconId: "google-maps",
    intents: [
      { id: "place", label: "Place" },
      { id: "directions", label: "Directions", matchPath: (p) => p.includes("/dir/") },
      { id: "coords", label: "Coordinates" },
    ],
  },
  {
    type: "apple-maps",
    label: "Apple Maps",
    category: "location",
    hosts: ["maps.apple.com"],
    intents: [
      { id: "place", label: "Place" },
      { id: "directions", label: "Directions", matchPath: (p) => p.includes("dir") },
    ],
  },
  {
    type: "waze",
    label: "Waze",
    category: "location",
    hosts: ["waze.com"],
    intents: [
      { id: "place", label: "Place" },
      { id: "navigate", label: "Navigate", matchPath: (p) => p.includes("navigate") },
    ],
  },
];
