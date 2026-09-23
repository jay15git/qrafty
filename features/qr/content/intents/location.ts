import {
  normalizeUrl,
  stringFieldValue,
} from "@/features/qr/content/platform-builders"
import {
  textField,
  urlIntent,
  type PlatformDef,
} from "@/features/qr/content/intents/shared"

export const LOCATION_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "map-location",
    label: "Google Maps",
    description: "Place, directions, or coordinates.",
    collection: "contact",
    category: "location",
    hosts: ["maps.google.com", "maps.app.goo.gl"],
    brandIconId: "google-maps",
    intents: [
      {
        id: "place",
        label: "Place",
        fields: [
          textField("query", "Place"),
          textField("latitude", "Latitude"),
          textField("longitude", "Longitude"),
        ],
        build: (values) => {
          const url = stringFieldValue(values, "url")
          if (url) {
            return normalizeUrl(url)
          }

          const latitude = stringFieldValue(values, "latitude")
          const longitude = stringFieldValue(values, "longitude")
          const query = stringFieldValue(values, "query")

          if (latitude || longitude) {
            const suffix = query ? `?q=${encodeURIComponent(query)}` : ""
            return `geo:${latitude},${longitude}${suffix}`
          }

          return `https://maps.google.com/?q=${encodeURIComponent(query)}`
        },
      },
      urlIntent("directions", "Directions", (p) => p.includes("/dir/")),
      {
        id: "coords",
        label: "Coordinates",
        fields: [
          textField("latitude", "Latitude"),
          textField("longitude", "Longitude"),
          textField("query", "Label"),
        ],
        build: (values) => {
          const lat = stringFieldValue(values, "latitude")
          const lng = stringFieldValue(values, "longitude")
          const query = stringFieldValue(values, "query")
          const suffix = query ? `?q=${encodeURIComponent(query)}` : ""
          return `geo:${lat},${lng}${suffix}`
        },
      },
    ],
  },
  {
    type: "apple-maps",
    label: "Apple Maps",
    description: "Place or directions.",
    collection: "contact",
    category: "location",
    hosts: ["maps.apple.com"],
    intents: [urlIntent("place", "Place"), urlIntent("directions", "Directions", (p) => p.includes("dir"))],
  },
  {
    type: "waze",
    label: "Waze",
    description: "Place or navigation link.",
    collection: "contact",
    category: "location",
    hosts: ["waze.com"],
    intents: [urlIntent("place", "Place"), urlIntent("navigate", "Navigate", (p) => p.includes("navigate"))],
  },
]
