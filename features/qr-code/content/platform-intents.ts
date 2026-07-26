import type { QrInputType } from "@/features/qr-code/content/input-options"

export type PlatformContentValues = Record<string, string | boolean | undefined>

import {
  idOrUrl,
  normalizeUrl,
  normalizeUsername,
  stringFieldValue,
  urlOrBuild,
  usernameProfileUrl,
} from "@/features/qr-code/content/platform-builders"
import { getIntentSampleValues } from "@/features/qr-code/content/platform-samples"

export type ContentCollectionId =
  | "popular"
  | "social"
  | "messaging"
  | "apps"
  | "music"
  | "business"
  | "files"
  | "contact"
  | "more"

export type FieldKind = "username" | "url" | "id" | "phone" | "text" | "amount" | "instance"

export type PlatformFieldDef = {
  key: string
  kind: FieldKind
  label: string
  placeholder?: string
  required?: boolean
}

export type PlatformIntentDef = {
  id: string
  label: string
  fields: readonly PlatformFieldDef[]
  build: (values: PlatformContentValues) => string
  matchPath?: (pathname: string, searchParams: URLSearchParams) => boolean
}

export type PlatformDef = {
  type: QrInputType
  label: string
  description: string
  collection: ContentCollectionId
  category: "social" | "messaging" | "app" | "music" | "business" | "file" | "location" | "developer"
  hosts: readonly string[]
  brandIconId?: string
  intents: readonly PlatformIntentDef[]
}

const usernameField = (label = "Username", required = true): PlatformFieldDef => ({
  key: "username",
  kind: "username",
  label,
  placeholder: "@newqr",
  required,
})

const urlField = (label = "URL", required = true): PlatformFieldDef => ({
  key: "url",
  kind: "url",
  label,
  placeholder: "https://example.com",
  required,
})

const idField = (label: string, placeholder: string): PlatformFieldDef => ({
  key: "id",
  kind: "id",
  label,
  placeholder,
  required: true,
})

const textField = (key: string, label: string, placeholder?: string): PlatformFieldDef => ({
  key,
  kind: "text",
  label,
  placeholder,
})

function profileIntent(
  baseUrl: string,
  prefix = "",
  opts?: { matchPath?: PlatformIntentDef["matchPath"] },
): PlatformIntentDef {
  return {
    id: "profile",
    label: "Profile",
    fields: [usernameField()],
    build: (values) => usernameProfileUrl(values, baseUrl, prefix),
    matchPath:
      opts?.matchPath ??
      ((pathname) => {
        const segments = pathname.split("/").filter(Boolean)
        return segments.length <= 1
      }),
  }
}

function urlIntent(
  id: string,
  label: string,
  matchPath?: PlatformIntentDef["matchPath"],
): PlatformIntentDef {
  return {
    id,
    label,
    fields: [urlField()],
    build: (values) => normalizeUrl(stringFieldValue(values, "url")),
    matchPath,
  }
}

function usernameOrUrlIntent(
  id: string,
  label: string,
  buildFromUsername: (username: string) => string,
  matchPath?: PlatformIntentDef["matchPath"],
): PlatformIntentDef {
  return {
    id,
    label,
    fields: [usernameField(), urlField("URL (optional)", false)],
    build: (values) =>
      urlOrBuild(values, (v) => buildFromUsername(normalizeUsername(stringFieldValue(v, "username")))),
    matchPath,
  }
}

function idOrUrlIntent(
  id: string,
  label: string,
  buildFromId: (id: string) => string,
  idLabel: string,
  idPlaceholder: string,
  matchPath?: PlatformIntentDef["matchPath"],
): PlatformIntentDef {
  return {
    id,
    label,
    fields: [idField(idLabel, idPlaceholder), urlField("URL (optional)", false)],
    build: (values) => idOrUrl(values, buildFromId),
    matchPath,
  }
}

export const PLATFORM_DEFS: readonly PlatformDef[] = [
  // Social
  {
    type: "instagram",
    label: "Instagram",
    description: "Profile, post, reel, story, or highlight link.",
    collection: "social",
    category: "social",
    hosts: ["instagram.com"],
    brandIconId: "instagram",
    intents: [
      profileIntent("https://instagram.com/"),
      idOrUrlIntent("post", "Post", (id) => `https://instagram.com/p/${id}`, "Post ID", "CxYz123", (p) =>
        p.includes("/p/"),
      ),
      idOrUrlIntent("reel", "Reel", (id) => `https://instagram.com/reel/${id}`, "Reel ID", "CxYz123", (p) =>
        p.includes("/reel/"),
      ),
      urlIntent("story", "Story", (p) => p.includes("/stories/")),
      idOrUrlIntent(
        "highlight",
        "Highlight",
        (id) => `https://instagram.com/stories/highlights/${id}`,
        "Highlight ID",
        "1234567890",
        (p) => p.includes("/stories/highlights/"),
      ),
    ],
  },
  {
    type: "x",
    label: "X",
    description: "Profile, post, list, community, or space.",
    collection: "social",
    category: "social",
    hosts: ["x.com", "twitter.com"],
    brandIconId: "x",
    intents: [
      profileIntent("https://x.com/"),
      urlIntent("status", "Post", (p) => p.includes("/status/")),
      urlIntent("list", "List", (p) => p.includes("/i/lists/")),
      urlIntent("community", "Community", (p) => p.includes("/i/communities/")),
      urlIntent("space", "Space", (p) => p.includes("/i/spaces/")),
    ],
  },
  {
    type: "tiktok",
    label: "TikTok",
    description: "Profile, video, or live link.",
    collection: "social",
    category: "social",
    hosts: ["tiktok.com"],
    brandIconId: "tiktok",
    intents: [
      usernameOrUrlIntent("profile", "Profile", (u) => `https://tiktok.com/@${u}`, (p) => {
        const segments = p.split("/").filter(Boolean)
        return segments.length <= 1 || segments[0]?.startsWith("@")
      }),
      urlIntent("video", "Video", (p) => p.includes("/video/") || p.includes("/t/")),
      urlIntent("live", "Live", (p) => p.includes("/live")),
    ],
  },
  {
    type: "youtube",
    label: "YouTube",
    description: "Channel, video, Shorts, playlist, or live.",
    collection: "social",
    category: "social",
    hosts: ["youtube.com", "youtu.be", "m.youtube.com"],
    brandIconId: "youtube",
    intents: [
      usernameOrUrlIntent("channel", "Channel", (u) => `https://youtube.com/@${u}`, (p) =>
        p.startsWith("/@") || p.startsWith("/channel/") || p.startsWith("/c/"),
      ),
      urlIntent("video", "Video", (p) => p.includes("/watch") || p.startsWith("/shorts/") === false && p.includes("/v/")),
      urlIntent("shorts", "Shorts", (p) => p.includes("/shorts/")),
      urlIntent("playlist", "Playlist", (p) => p.includes("/playlist")),
      urlIntent("live", "Live", (p) => p.includes("/live")),
    ],
  },
  {
    type: "facebook",
    label: "Facebook",
    description: "Profile, page, post, group, event, or reel.",
    collection: "social",
    category: "social",
    hosts: ["facebook.com", "fb.com", "m.facebook.com"],
    brandIconId: "facebook",
    intents: [
      urlIntent("profile", "Profile"),
      urlIntent("page", "Page", (p) => p.includes("/pages/") || p.includes("/profile.php")),
      urlIntent("post", "Post", (p) => p.includes("/posts/") || p.includes("/permalink/")),
      urlIntent("group", "Group", (p) => p.includes("/groups/")),
      urlIntent("event", "Event", (p) => p.includes("/events/")),
      urlIntent("reel", "Reel", (p) => p.includes("/reel/")),
    ],
  },
  {
    type: "linkedin",
    label: "LinkedIn",
    description: "Profile, company, post, or job.",
    collection: "social",
    category: "social",
    hosts: ["linkedin.com"],
    intents: [
      urlIntent("profile", "Profile", (p) => p.includes("/in/")),
      urlIntent("company", "Company", (p) => p.includes("/company/")),
      urlIntent("post", "Post", (p) => p.includes("/feed/update/") || p.includes("/posts/")),
      urlIntent("job", "Job", (p) => p.includes("/jobs/")),
    ],
  },
  {
    type: "threads",
    label: "Threads",
    description: "Profile or post link.",
    collection: "social",
    category: "social",
    hosts: ["threads.net"],
    brandIconId: "threads",
    intents: [
      usernameOrUrlIntent("profile", "Profile", (u) => `https://threads.net/@${u}`),
      urlIntent("post", "Post", (p) => p.includes("/post/")),
    ],
  },
  {
    type: "snapchat",
    label: "Snapchat",
    description: "Add friend, Spotlight, or Lens.",
    collection: "social",
    category: "social",
    hosts: ["snapchat.com"],
    brandIconId: "snapchat",
    intents: [
      usernameOrUrlIntent("add", "Add", (u) => `https://snapchat.com/add/${u}`, (p) => p.includes("/add/")),
      urlIntent("spotlight", "Spotlight", (p) => p.includes("/spotlight/")),
      urlIntent("lens", "Lens", (p) => p.includes("/lens/")),
    ],
  },
  {
    type: "pinterest",
    label: "Pinterest",
    description: "Profile, pin, or board.",
    collection: "social",
    category: "social",
    hosts: ["pinterest.com"],
    brandIconId: "pinterest",
    intents: [
      usernameOrUrlIntent("profile", "Profile", (u) => `https://pinterest.com/${u}`),
      urlIntent("pin", "Pin", (p) => p.includes("/pin/")),
      urlIntent("board", "Board", (p) => p.includes("/board/") || (p.split("/").filter(Boolean).length >= 2 && !p.includes("/pin/"))),
    ],
  },
  {
    type: "reddit",
    label: "Reddit",
    description: "User, subreddit, post, or comment.",
    collection: "social",
    category: "social",
    hosts: ["reddit.com", "old.reddit.com"],
    intents: [
      usernameOrUrlIntent("user", "User", (u) => `https://reddit.com/u/${u}`, (p) => p.startsWith("/u/") || p.startsWith("/user/")),
      urlIntent("subreddit", "Subreddit", (p) => p.startsWith("/r/") && !p.includes("/comments/")),
      urlIntent("post", "Post", (p) => p.includes("/comments/")),
      urlIntent("comment", "Comment", (p) => p.includes("/comments/") && p.split("/").length > 6),
    ],
  },
  {
    type: "twitch",
    label: "Twitch",
    description: "Channel, video, or clip.",
    collection: "social",
    category: "social",
    hosts: ["twitch.tv"],
    intents: [
      usernameOrUrlIntent("channel", "Channel", (u) => `https://twitch.tv/${u}`, (p) => {
        const seg = p.split("/").filter(Boolean)
        return seg.length === 1
      }),
      urlIntent("video", "Video", (p) => p.includes("/videos/")),
      urlIntent("clip", "Clip", (p) => p.includes("/clip/")),
    ],
  },
  {
    type: "bluesky",
    label: "Bluesky",
    description: "Profile or post.",
    collection: "social",
    category: "social",
    hosts: ["bsky.app"],
    intents: [
      urlIntent("profile", "Profile", (p) => p.includes("/profile/")),
      urlIntent("post", "Post", (p) => p.includes("/post/")),
    ],
  },
  {
    type: "mastodon",
    label: "Mastodon",
    description: "Profile or post on any instance.",
    collection: "social",
    category: "social",
    hosts: [],
    intents: [
      {
        id: "profile",
        label: "Profile",
        fields: [
          textField("instance", "Instance", "mastodon.social"),
          usernameField("Handle"),
        ],
        build: (values) => {
          const url = stringFieldValue(values, "url")
          if (url) return normalizeUrl(url)
          const instance = stringFieldValue(values, "instance").replace(/^https?:\/\//, "")
          const username = normalizeUsername(stringFieldValue(values, "username"))
          return `https://${instance}/@${username}`
        },
      },
      urlIntent("post", "Post"),
    ],
  },
  {
    type: "tumblr",
    label: "Tumblr",
    description: "Blog or post.",
    collection: "social",
    category: "social",
    hosts: ["tumblr.com"],
    intents: [
      usernameOrUrlIntent("blog", "Blog", (u) => `https://${u}.tumblr.com`),
      urlIntent("post", "Post", (p) => p.includes("/post/")),
    ],
  },

  // Messaging
  {
    type: "whatsapp",
    label: "WhatsApp",
    description: "Chat or group invite link.",
    collection: "messaging",
    category: "messaging",
    hosts: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com"],
    brandIconId: "whatsapp",
    intents: [
      {
        id: "chat",
        label: "Chat",
        fields: [
          { key: "phone", kind: "phone", label: "Phone number", placeholder: "+91 98765 43210", required: true },
          textField("message", "Message", "Hello"),
        ],
        build: (values) => {
          const url = stringFieldValue(values, "url")
          if (url) return normalizeUrl(url)
          const phone = stringFieldValue(values, "phone").replace(/\D/g, "")
          const message = stringFieldValue(values, "message")
          return message
            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/${phone}`
        },
        matchPath: (_, params) => !stringFieldValue({ url: params.get("invite") ?? "" }, "url"),
      },
      urlIntent("group", "Group invite", (p) => p.includes("chat.whatsapp.com")),
    ],
  },
  {
    type: "telegram",
    label: "Telegram",
    description: "Username, message, channel, group, or share link.",
    collection: "messaging",
    category: "messaging",
    hosts: ["t.me", "telegram.me", "telegram.dog"],
    brandIconId: "telegram",
    intents: [
      usernameOrUrlIntent("username", "Username", (u) => `https://t.me/${u}`, (p) => {
        const seg = p.split("/").filter(Boolean)
        return seg.length === 1 && !p.includes("+") && !p.includes("joinchat")
      }),
      {
        id: "message",
        label: "Message",
        fields: [usernameField(), textField("message", "Message", "Hello")],
        build: (values) => {
          const url = stringFieldValue(values, "url")
          if (url) return normalizeUrl(url)
          const username = normalizeUsername(stringFieldValue(values, "username"))
          const message = stringFieldValue(values, "message")
          return `https://t.me/${username}?text=${encodeURIComponent(message)}`
        },
      },
      urlIntent("channel", "Channel", (p) => p.startsWith("/c/") || p.includes("/s/")),
      urlIntent("group", "Group", (p) => p.includes("+") || p.includes("joinchat")),
      urlIntent("share", "Share", (p) => p.includes("/share/")),
    ],
  },
  {
    type: "discord",
    label: "Discord",
    description: "Invite, server, or channel link.",
    collection: "messaging",
    category: "messaging",
    hosts: ["discord.gg", "discord.com"],
    brandIconId: "discord",
    intents: [
      urlIntent("invite", "Invite", (p) => p.includes("/invite") || /^\/[A-Za-z0-9]+$/.test(p)),
      urlIntent("server", "Server", (p) => p.includes("/channels/")),
      urlIntent("channel", "Channel", (p) => p.includes("/channels/")),
    ],
  },
  {
    type: "messenger",
    label: "Messenger",
    description: "Messenger profile or chat link.",
    collection: "messaging",
    category: "messaging",
    hosts: ["m.me", "messenger.com"],
    intents: [urlIntent("user", "User")],
  },
  {
    type: "signal",
    label: "Signal",
    description: "Signal chat link.",
    collection: "messaging",
    category: "messaging",
    hosts: ["signal.me"],
    intents: [urlIntent("chat", "Chat")],
  },
  {
    type: "line",
    label: "Line",
    description: "Line profile or chat.",
    collection: "messaging",
    category: "messaging",
    hosts: ["line.me"],
    intents: [
      urlIntent("profile", "Profile", (p) => p.includes("/ti/p/")),
      urlIntent("chat", "Chat"),
    ],
  },
  {
    type: "skype",
    label: "Skype",
    description: "Skype chat or call link.",
    collection: "messaging",
    category: "messaging",
    hosts: ["join.skype.com", "skype.com"],
    intents: [
      urlIntent("chat", "Chat", (p) => p.includes("/chat")),
      urlIntent("call", "Call", (p) => p.includes("/call") || p.includes("skype:")),
    ],
  },

  // App stores
  {
    type: "app-store",
    label: "App Store",
    description: "Apple App Store app page.",
    collection: "apps",
    category: "app",
    hosts: ["apps.apple.com", "appstore.com"],
    intents: [
      idOrUrlIntent("app", "App", (id) => `https://apps.apple.com/app/id${id}`, "App ID", "123456789"),
    ],
  },
  {
    type: "play-store",
    label: "Play Store",
    description: "Google Play app page.",
    collection: "apps",
    category: "app",
    hosts: ["play.google.com"],
    intents: [
      idOrUrlIntent(
        "app",
        "App",
        (id) => `https://play.google.com/store/apps/details?id=${id}`,
        "Package name",
        "com.example.app",
        (p) => p.includes("/store/apps/"),
      ),
    ],
  },
  {
    type: "microsoft-store",
    label: "Microsoft Store",
    description: "Microsoft Store app page.",
    collection: "apps",
    category: "app",
    hosts: ["apps.microsoft.com"],
    intents: [urlIntent("app", "App")],
  },
  {
    type: "amazon-appstore",
    label: "Amazon Appstore",
    description: "Amazon Appstore app page.",
    collection: "apps",
    category: "app",
    hosts: ["amazon.com"],
    intents: [urlIntent("app", "App", (p) => p.includes("/dp/") || p.includes("/gp/product/"))],
  },
  {
    type: "huawei-appgallery",
    label: "Huawei AppGallery",
    description: "Huawei AppGallery app page.",
    collection: "apps",
    category: "app",
    hosts: ["appgallery.huawei.com"],
    intents: [urlIntent("app", "App")],
  },

  // Music
  {
    type: "spotify",
    label: "Spotify",
    description: "Track, album, artist, playlist, show, or episode.",
    collection: "music",
    category: "music",
    hosts: ["open.spotify.com"],
    intents: [
      urlIntent("track", "Track", (p) => p.includes("/track/")),
      urlIntent("album", "Album", (p) => p.includes("/album/")),
      urlIntent("artist", "Artist", (p) => p.includes("/artist/")),
      urlIntent("playlist", "Playlist", (p) => p.includes("/playlist/")),
      urlIntent("show", "Show", (p) => p.includes("/show/")),
      urlIntent("episode", "Episode", (p) => p.includes("/episode/")),
    ],
  },
  {
    type: "apple-music",
    label: "Apple Music",
    description: "Song, album, artist, or playlist.",
    collection: "music",
    category: "music",
    hosts: ["music.apple.com"],
    intents: [
      urlIntent("song", "Song"),
      urlIntent("album", "Album", (p) => p.includes("/album/")),
      urlIntent("artist", "Artist", (p) => p.includes("/artist/")),
      urlIntent("playlist", "Playlist", (p) => p.includes("/playlist/")),
    ],
  },
  {
    type: "soundcloud",
    label: "SoundCloud",
    description: "Track, user, or playlist.",
    collection: "music",
    category: "music",
    hosts: ["soundcloud.com"],
    intents: [
      urlIntent("track", "Track"),
      usernameOrUrlIntent("user", "User", (u) => `https://soundcloud.com/${u}`),
      urlIntent("playlist", "Playlist", (p) => p.includes("/sets/")),
    ],
  },
  {
    type: "youtube-music",
    label: "YouTube Music",
    description: "Track, album, artist, or playlist.",
    collection: "music",
    category: "music",
    hosts: ["music.youtube.com"],
    brandIconId: "youtube",
    intents: [
      urlIntent("track", "Track", (p) => p.includes("/watch")),
      urlIntent("album", "Album", (p) => p.includes("/playlist")),
      urlIntent("artist", "Artist", (p) => p.includes("/channel/")),
      urlIntent("playlist", "Playlist", (p) => p.includes("/playlist")),
    ],
  },
  {
    type: "deezer",
    label: "Deezer",
    description: "Track, album, artist, or playlist.",
    collection: "music",
    category: "music",
    hosts: ["deezer.com"],
    intents: [
      urlIntent("track", "Track", (p) => p.includes("/track/")),
      urlIntent("album", "Album", (p) => p.includes("/album/")),
      urlIntent("artist", "Artist", (p) => p.includes("/artist/")),
      urlIntent("playlist", "Playlist", (p) => p.includes("/playlist/")),
    ],
  },

  // Maps
  {
    type: "map-location",
    label: "Google Maps",
    description: "Place, directions, or coordinates.",
    collection: "contact",
    category: "location",
    hosts: ["maps.google.com", "maps.app.goo.gl", "google.com"],
    brandIconId: "google-maps",
    intents: [
      {
        id: "place",
        label: "Place",
        fields: [
          textField("query", "Place", "Mumbai"),
          textField("latitude", "Latitude", "19.0760"),
          textField("longitude", "Longitude", "72.8777"),
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
          textField("latitude", "Latitude", "19.0760"),
          textField("longitude", "Longitude", "72.8777"),
          textField("query", "Label", ""),
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

  // Business
  {
    type: "google-review",
    label: "Google Review",
    description: "Google business review link.",
    collection: "business",
    category: "business",
    hosts: ["g.page", "business.google.com", "maps.google.com"],
    intents: [urlIntent("place", "Place")],
  },
  {
    type: "booking-link",
    label: "Booking",
    description: "Booking or reservation link.",
    collection: "business",
    category: "business",
    hosts: ["booking.com", "acuityscheduling.com"],
    brandIconId: "calendly",
    intents: [urlIntent("url", "URL")],
  },
  {
    type: "calendly",
    label: "Calendly",
    description: "Calendly event link.",
    collection: "business",
    category: "business",
    hosts: ["calendly.com"],
    brandIconId: "calendly",
    intents: [urlIntent("event", "Event")],
  },
  {
    type: "payment-link",
    label: "Payment Link",
    description: "Checkout or payment page.",
    collection: "business",
    category: "business",
    hosts: ["stripe.com", "checkout.stripe.com", "paypal.com", "razorpay.com", "square.link"],
    brandIconId: "stripe",
    intents: [urlIntent("url", "URL")],
  },
  {
    type: "paypal-me",
    label: "PayPal.me",
    description: "PayPal.me profile with optional amount.",
    collection: "business",
    category: "business",
    hosts: ["paypal.me"],
    intents: [
      {
        id: "profile",
        label: "Profile",
        fields: [usernameField("Username"), textField("amount", "Amount (optional)")],
        build: (values) => {
          const url = stringFieldValue(values, "url")
          if (url) return normalizeUrl(url)
          const username = normalizeUsername(stringFieldValue(values, "username"))
          const amount = stringFieldValue(values, "amount")
          return amount ? `https://paypal.me/${username}/${amount}` : `https://paypal.me/${username}`
        },
      },
    ],
  },
  {
    type: "venmo",
    label: "Venmo",
    description: "Venmo profile or payment.",
    collection: "business",
    category: "business",
    hosts: ["venmo.com"],
    intents: [
      usernameOrUrlIntent("profile", "Profile", (u) => `https://venmo.com/${u}`),
      urlIntent("payment", "Payment", (p) => p.includes("txn=") || p.includes("/pay/")),
    ],
  },
  {
    type: "cash-app",
    label: "Cash App",
    description: "Cash App $cashtag link.",
    collection: "business",
    category: "business",
    hosts: ["cash.app"],
    intents: [
      usernameOrUrlIntent("cashtag", "Cashtag", (u) => `https://cash.app/$${normalizeUsername(u)}`, (p) =>
        p.includes("/$"),
      ),
    ],
  },
  {
    type: "menu",
    label: "Menu",
    description: "Restaurant or venue menu URL.",
    collection: "business",
    category: "business",
    hosts: [],
    intents: [urlIntent("url", "URL")],
  },
  {
    type: "form",
    label: "Form",
    description: "Google Forms, Typeform, Tally, or Jotform.",
    collection: "business",
    category: "business",
    hosts: ["forms.gle", "docs.google.com", "typeform.com", "jotform.com", "tally.so"],
    intents: [urlIntent("url", "URL")],
  },
  {
    type: "zoom",
    label: "Zoom",
    description: "Zoom meeting link.",
    collection: "business",
    category: "business",
    hosts: ["zoom.us"],
    intents: [urlIntent("meeting", "Meeting", (p) => p.includes("/j/") || p.includes("/meeting/"))],
  },
  {
    type: "google-meet",
    label: "Google Meet",
    description: "Google Meet link.",
    collection: "business",
    category: "business",
    hosts: ["meet.google.com"],
    intents: [urlIntent("meeting", "Meeting")],
  },
  {
    type: "microsoft-teams",
    label: "Microsoft Teams",
    description: "Teams meeting link.",
    collection: "business",
    category: "business",
    hosts: ["teams.microsoft.com", "teams.live.com"],
    intents: [urlIntent("meeting", "Meeting")],
  },

  // Files
  {
    type: "pdf",
    label: "PDF",
    description: "Hosted PDF URL.",
    collection: "files",
    category: "file",
    hosts: [],
    intents: [urlIntent("url", "URL", (p) => p.endsWith(".pdf") || p.includes("/pdf/"))],
  },
  {
    type: "image",
    label: "Image",
    description: "Hosted image URL.",
    collection: "files",
    category: "file",
    hosts: [],
    intents: [
      urlIntent("url", "URL", (p) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(p)),
    ],
  },
  {
    type: "video",
    label: "Video",
    description: "Hosted video URL.",
    collection: "files",
    category: "file",
    hosts: [],
    intents: [urlIntent("url", "URL", (p) => /\.(mp4|mov|webm|m4v)$/i.test(p))],
  },
  {
    type: "document",
    label: "Document",
    description: "Hosted document URL.",
    collection: "files",
    category: "file",
    hosts: [],
    intents: [urlIntent("url", "URL")],
  },
  {
    type: "website",
    label: "Website",
    description: "Generic website URL.",
    collection: "popular",
    category: "business",
    hosts: [],
    intents: [urlIntent("url", "URL")],
  },

  // Developer
  {
    type: "github",
    label: "GitHub",
    description: "User, repo, issue, or gist.",
    collection: "more",
    category: "developer",
    hosts: ["github.com", "gist.github.com"],
    intents: [
      usernameOrUrlIntent("user", "User", (u) => `https://github.com/${u}`, (p) => {
        const seg = p.split("/").filter(Boolean)
        return seg.length === 1
      }),
      urlIntent("repo", "Repository", (p) => {
        const seg = p.split("/").filter(Boolean)
        return seg.length === 2
      }),
      urlIntent("issue", "Issue", (p) => p.includes("/issues/")),
      urlIntent("gist", "Gist", (p) => p.includes("gist.github.com") || p.startsWith("/gist/")),
    ],
  },
  {
    type: "gitlab",
    label: "GitLab",
    description: "User, project, or issue.",
    collection: "more",
    category: "developer",
    hosts: ["gitlab.com"],
    intents: [
      usernameOrUrlIntent("user", "User", (u) => `https://gitlab.com/${u}`),
      urlIntent("project", "Project"),
      urlIntent("issue", "Issue", (p) => p.includes("/-/issues/")),
    ],
  },
  {
    type: "notion",
    label: "Notion",
    description: "Notion page link.",
    collection: "more",
    category: "developer",
    hosts: ["notion.so", "notion.site"],
    intents: [urlIntent("page", "Page")],
  },
  {
    type: "medium",
    label: "Medium",
    description: "Profile or story.",
    collection: "more",
    category: "developer",
    hosts: ["medium.com"],
    intents: [
      usernameOrUrlIntent("profile", "Profile", (u) => `https://medium.com/@${u}`),
      urlIntent("story", "Story"),
    ],
  },
  {
    type: "substack",
    label: "Substack",
    description: "Publication or post.",
    collection: "more",
    category: "developer",
    hosts: ["substack.com"],
    intents: [
      urlIntent("publication", "Publication"),
      urlIntent("post", "Post", (p) => p.includes("/p/")),
    ],
  },
] as const

const PLATFORM_DEF_BY_TYPE = new Map<QrInputType, PlatformDef>(
  PLATFORM_DEFS.map((def) => [def.type, def]),
)

export const PLATFORM_TYPES = new Set<QrInputType>(PLATFORM_DEFS.map((def) => def.type))

export const LEGACY_PLATFORM_ALIASES: Partial<Record<QrInputType, QrInputType>> = {
  "telegram-username": "telegram",
  "whatsapp-chat": "whatsapp",
  "app-download": "app-store",
}

export const URL_ONLY_ALIAS_TYPES = new Set<QrInputType>([
  "auto",
  "website",
  "app-download",
])

export function getPlatformDef(type: QrInputType): PlatformDef | undefined {
  const resolved = LEGACY_PLATFORM_ALIASES[type] ?? type
  return PLATFORM_DEF_BY_TYPE.get(resolved)
}

export function isPlatformType(type: QrInputType): boolean {
  return PLATFORM_TYPES.has(type) || type in LEGACY_PLATFORM_ALIASES
}

export function resolvePlatformType(type: QrInputType): QrInputType {
  return LEGACY_PLATFORM_ALIASES[type] ?? type
}

export function getDefaultIntentId(type: QrInputType): string {
  const def = getPlatformDef(type)
  return def?.intents[0]?.id ?? "url"
}

export function getIntentDef(type: QrInputType, intentId: string): PlatformIntentDef | undefined {
  const def = getPlatformDef(type)
  return def?.intents.find((intent) => intent.id === intentId) ?? def?.intents[0]
}

export function getPlatformDefaultValues(type: QrInputType): PlatformContentValues {
  return getPlatformDefaultValuesForIntent(type)
}

export function getPlatformDefaultValuesForIntent(
  type: QrInputType,
  intentId?: string,
): PlatformContentValues {
  const resolved = resolvePlatformType(type)
  const def = getPlatformDef(resolved)
  if (!def) {
    return { url: "https://example.com" }
  }

  const intent = getIntentDef(resolved, intentId ?? getDefaultIntentId(resolved))
  const activeIntentId = intent?.id ?? getDefaultIntentId(resolved)
  const samples = getIntentSampleValues(resolved, activeIntentId)
  const values: PlatformContentValues = { intent: activeIntentId }

  for (const field of intent?.fields ?? []) {
    if (field.key === "hidden") {
      values.hidden = false
      continue
    }

    values[field.key] = samples[field.key] ?? ""
  }

  return values
}

export function buildPlatformPayload(
  type: QrInputType,
  values: PlatformContentValues,
): string {
  const resolved = resolvePlatformType(type)
  const intentId = stringFieldValue(values, "intent") || getDefaultIntentId(resolved)
  const intent = getIntentDef(resolved, intentId)
  if (!intent) {
    return normalizeUrl(stringFieldValue(values, "url"))
  }
  return intent.build(values)
}

export function validatePlatformContent(
  type: QrInputType,
  values: PlatformContentValues,
): Record<string, string> {
  const resolved = resolvePlatformType(type)
  const intentId = stringFieldValue(values, "intent") || getDefaultIntentId(resolved)
  const intent = getIntentDef(resolved, intentId)
  const fieldErrors: Record<string, string> = {}

  if (!intent) {
    if (!stringFieldValue(values, "url")) {
      fieldErrors.url = "Enter a URL."
    }
    return fieldErrors
  }

  const hasUrl = Boolean(stringFieldValue(values, "url"))

  for (const field of intent.fields) {
    if (!field.required || hasUrl) {
      continue
    }
    if (!stringFieldValue(values, field.key)) {
      fieldErrors[field.key] = `Enter ${field.label.toLowerCase()}.`
    }
  }

  if (intent.fields.length === 1 && intent.fields[0]?.key === "url" && !hasUrl) {
    fieldErrors.url = "Enter a URL."
  }

  if (resolved === "map-location") {
    const latitude = stringFieldValue(values, "latitude")
    const longitude = stringFieldValue(values, "longitude")

    if (latitude || longitude) {
      if (!isLatitude(latitude)) {
        fieldErrors.latitude = "Latitude must be between -90 and 90."
      }
      if (!isLongitude(longitude)) {
        fieldErrors.longitude = "Longitude must be between -180 and 180."
      }
    }
  }

  return fieldErrors
}

function isLatitude(value: string) {
  if (!value) {
    return false
  }
  const number = Number(value)
  return Number.isFinite(number) && number >= -90 && number <= 90
}

function isLongitude(value: string) {
  if (!value) {
    return false
  }
  const number = Number(value)
  return Number.isFinite(number) && number >= -180 && number <= 180
}

export function detectPlatformIntentFromUrl(
  input: string,
): { type: QrInputType; intent: string; platform?: string; brandIconId?: string } | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  let parsed: URL
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    parsed = new URL(candidate)
  } catch {
    return null
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")
  const pathname = parsed.pathname
  const searchParams = parsed.searchParams

  for (const def of PLATFORM_DEFS) {
    if (def.hosts.length === 0) {
      continue
    }

    const hostMatched = def.hosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    )
    if (!hostMatched) {
      continue
    }

    for (const intent of def.intents) {
      if (intent.matchPath?.(pathname, searchParams)) {
        return {
          type: def.type,
          intent: intent.id,
          platform: def.type,
          brandIconId: def.brandIconId,
        }
      }
    }

    return {
      type: def.type,
      intent: def.intents[0]!.id,
      platform: def.type,
      brandIconId: def.brandIconId,
    }
  }

  return null
}

export function extractPlatformValuesFromUrl(
  type: QrInputType,
  input: string,
): Partial<PlatformContentValues> | null {
  const detection = detectPlatformIntentFromUrl(input)
  if (!detection || detection.type !== resolvePlatformType(type)) {
    return null
  }

  const values: Partial<PlatformContentValues> = {
    intent: detection.intent,
    url: input.trim(),
  }

  try {
    const parsed = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    const segments = parsed.pathname.split("/").filter(Boolean)

    if (detection.intent === "profile" || detection.intent === "username" || detection.intent === "add") {
      const handle = segments[0]?.replace(/^@/, "") ?? ""
      if (handle) {
        values.username = handle
      }
    }

    if (detection.intent === "post" && segments.includes("p")) {
      const idx = segments.indexOf("p")
      values.id = segments[idx + 1] ?? ""
    }
  } catch {
    // keep url only
  }

  return values
}

export const CONTENT_COLLECTIONS: ReadonlyArray<{
  id: ContentCollectionId
  label: string
  types: readonly QrInputType[]
}> = [
  {
    id: "popular",
    label: "Popular",
    types: ["link", "text", "phone", "email", "wifi", "vcard", "whatsapp", "instagram", "youtube"],
  },
  {
    id: "social",
    label: "Social",
    types: [
      "instagram",
      "x",
      "tiktok",
      "youtube",
      "facebook",
      "linkedin",
      "threads",
      "snapchat",
      "pinterest",
      "reddit",
      "twitch",
      "bluesky",
      "mastodon",
      "tumblr",
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    types: ["whatsapp", "telegram", "discord", "messenger", "signal", "line", "skype", "sms", "email", "phone"],
  },
  {
    id: "apps",
    label: "Apps",
    types: ["app-store", "play-store", "microsoft-store", "amazon-appstore", "huawei-appgallery"],
  },
  {
    id: "music",
    label: "Music",
    types: ["spotify", "apple-music", "soundcloud", "youtube-music", "deezer"],
  },
  {
    id: "business",
    label: "Business",
    types: [
      "google-review",
      "booking-link",
      "calendly",
      "payment-link",
      "paypal-me",
      "venmo",
      "cash-app",
      "menu",
      "form",
      "zoom",
      "google-meet",
      "microsoft-teams",
    ],
  },
  {
    id: "files",
    label: "Files",
    types: ["pdf", "image", "video", "document"],
  },
  {
    id: "contact",
    label: "Contact",
    types: ["phone", "email", "sms", "vcard", "map-location", "apple-maps", "waze"],
  },
  {
    id: "more",
    label: "More",
    types: ["event", "coupon", "upi", "crypto", "github", "gitlab", "notion", "medium", "substack"],
  },
]

export const PLATFORM_PICKER_TYPES: readonly QrInputType[] = [
  ...new Set(CONTENT_COLLECTIONS.flatMap((collection) => collection.types)),
]

export function getIntentLabel(type: QrInputType, intentId: string): string {
  return getIntentDef(type, intentId)?.label ?? intentId
}
