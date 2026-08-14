import type { QrInputType } from "@/features/qr-code/content/input-options"

export type PlatformContentValues = Record<string, string | boolean | undefined>

import {
  isPositiveAmount,
  isValidPhone,
  isValidPlatformUrl,
  isValidUrl,
  platformUrlErrorMessage,
  VALIDATION_MESSAGES,
} from "@/features/qr-code/content/content-field-validation"
import {
  normalizeUrl,
  stringFieldValue,
} from "@/features/qr-code/content/platform-builders"
import { getIntentSampleValues } from "@/features/qr-code/content/platform-samples"
import {
  isAcuityAppointmentPath,
  isAcuitySchedulePath,
  isBlueskyProfilePath,
  isBookingComHotelPath,
  isBookingComSharePath,
  isCalComEventPath,
  isCalComPrivatePath,
  isCalComTeamPath,
  isCalComUserPath,
  isCalendlyCollectivePath,
  isCalendlyEventPath,
  isCalendlyOneOffPath,
  isCalendlyProfilePath,
  isDiscordChannelPath,
  isDiscordServerPath,
  isFacebookProfilePath,
  isGitHubRepoPath,
  isGitHubUserPath,
  isGitLabProjectPath,
  isGitLabUserPath,
  isGoogleFormsFullPath,
  isGoogleFormsHost,
  isGoogleFormsShortHost,
  isJotformFormHost,
  isJotformSubmitPath,
  isMastodonPostPath,
  isMastodonProfilePath,
  isMediumProfilePath,
  isMediumStoryPath,
  isMicrosoftFormsPagePath,
  isMicrosoftFormsShortPath,
  isPinterestProfilePath,
  isRazorpayInvoicePath,
  isRazorpayShortLinkPath,
  isRedditCommentPath,
  isRedditPostPath,
  isSoundCloudTrackPath,
  isSoundCloudUserPath,
  isSquarePayPath,
  isSubstackPublicationPath,
  isTallyFormPath,
  isThreadsProfilePath,
  isTikTokLivePath,
  isTikTokProfilePath,
  isTikTokVideoPath,
  isTumblrBlogPath,
  isTypeformPath,
  isVenmoPaymentPath,
  isVenmoProfilePath,
  segments,
} from "@/features/qr-code/content/platform-path-matching"

export type ContentCollectionId =
  | "popular"
  | "social"
  | "messaging"
  | "apps"
  | "music"
  | "business"
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
  matchPath?: (pathname: string, searchParams: URLSearchParams, hostname?: string) => boolean
}

export type PlatformDef = {
  type: QrInputType
  label: string
  description: string
  collection: ContentCollectionId
  category: "social" | "messaging" | "app" | "music" | "business" | "file" | "location" | "developer"
  hosts: readonly string[]
  brandIconId?: string
  defaultIntentId?: string
  matchHost?: (hostname: string, pathname: string) => boolean
  intents: readonly PlatformIntentDef[]
}

const urlField = (label = "URL", required = true): PlatformFieldDef => ({
  key: "url",
  kind: "url",
  label,
  placeholder: "https://example.com",
  required,
})

const textField = (key: string, label: string, placeholder?: string): PlatformFieldDef => ({
  key,
  kind: "text",
  label,
  placeholder,
})

function profileIntent(matchPath?: PlatformIntentDef["matchPath"]): PlatformIntentDef {
  return urlIntent("profile", "Profile", matchPath)
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
      profileIntent((pathname) => {
        const segments = pathname.split("/").filter(Boolean)
        return segments.length <= 1
      }),
      urlIntent("post", "Post", (p) => p.includes("/p/")),
      urlIntent("reel", "Reel", (p) => p.includes("/reel/")),
      urlIntent("story", "Story", (p) => p.includes("/stories/") && !p.includes("/highlights/")),
      urlIntent("highlight", "Highlight", (p) => p.includes("/stories/highlights/")),
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
      profileIntent((pathname) => {
        const segments = pathname.split("/").filter(Boolean)
        return segments.length <= 1 && !pathname.includes("/status/")
      }),
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
    hosts: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
    brandIconId: "tiktok",
    intents: [
      urlIntent("video", "Video", (p) => isTikTokVideoPath(p)),
      urlIntent("live", "Live", (p) => isTikTokLivePath(p)),
      urlIntent("profile", "Profile", (p) => isTikTokProfilePath(p)),
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
      urlIntent("channel", "Channel", (p) =>
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
      urlIntent("page", "Page", (p) => p.includes("/pages/") || p.includes("/profile.php")),
      urlIntent("post", "Post", (p) => p.includes("/posts/") || p.includes("/permalink/") || p.includes("story.php")),
      urlIntent("group", "Group", (p) => p.includes("/groups/")),
      urlIntent("event", "Event", (p) => p.includes("/events/")),
      urlIntent("reel", "Reel", (p) => p.includes("/reel/")),
      urlIntent("profile", "Profile", (p) => isFacebookProfilePath(p)),
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
      urlIntent("post", "Post", (p) => p.includes("/post/")),
      urlIntent("profile", "Profile", (p) => isThreadsProfilePath(p)),
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
      urlIntent("add", "Add", (p) => p.includes("/add/")),
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
      urlIntent("pin", "Pin", (p) => p.includes("/pin/")),
      urlIntent("board", "Board", (p) => p.includes("/board/") || (segments(p).length >= 2 && !p.includes("/pin/"))),
      urlIntent("profile", "Profile", (p) => isPinterestProfilePath(p)),
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
      urlIntent("user", "User", (p) => p.startsWith("/u/") || p.startsWith("/user/")),
      urlIntent("subreddit", "Subreddit", (p) => p.startsWith("/r/") && !p.includes("/comments/")),
      urlIntent("comment", "Comment", (p) => isRedditCommentPath(p)),
      urlIntent("post", "Post", (p) => isRedditPostPath(p)),
    ],
  },
  {
    type: "twitch",
    label: "Twitch",
    description: "Channel, video, or clip.",
    collection: "social",
    category: "social",
    hosts: ["twitch.tv", "clips.twitch.tv"],
    intents: [
      urlIntent("video", "Video", (p) => p.includes("/videos/")),
      urlIntent("clip", "Clip", (p) => p.includes("/clip/")),
      urlIntent("channel", "Channel", (p) => segments(p).length === 1),
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
      urlIntent("post", "Post", (p) => p.includes("/post/")),
      urlIntent("profile", "Profile", (p) => isBlueskyProfilePath(p)),
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
      urlIntent("post", "Post", (p) => isMastodonPostPath(p)),
      urlIntent("profile", "Profile", (p) => isMastodonProfilePath(p)),
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
      urlIntent("post", "Post", (p) => p.includes("/post/")),
      urlIntent("blog", "Blog", (p) => isTumblrBlogPath(p)),
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
      urlIntent("channel", "Channel", (p) => p.startsWith("/c/") || p.includes("/s/")),
      urlIntent("group", "Group", (p) => p.includes("+") || p.includes("joinchat")),
      urlIntent("share", "Share", (p) => p.includes("/share/")),
      urlIntent("username", "Username", (p, params) => {
        const seg = segments(p)
        return seg.length === 1 && !p.includes("+") && !p.includes("joinchat") && !params.has("text")
      }),
      {
        id: "message",
        label: "Message",
        fields: [urlField(), textField("message", "Message")],
        build: (values) => {
          const url = normalizeUrl(stringFieldValue(values, "url"))
          const message = stringFieldValue(values, "message")
          if (!message) {
            return url
          }

          try {
            const parsed = new URL(url)
            parsed.searchParams.set("text", message)
            return parsed.toString()
          } catch {
            return url
          }
        },
        matchPath: (p, params) => segments(p).length === 1 && params.has("text"),
      },
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
      urlIntent("channel", "Channel", (p) => isDiscordChannelPath(p)),
      urlIntent("server", "Server", (p) => isDiscordServerPath(p)),
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
      urlIntent("chat", "Chat", (p) => p.includes("/R/ti/p/")),
      urlIntent("profile", "Profile", (p) => p.includes("/ti/p/") && !p.includes("/R/ti/p/")),
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
    intents: [urlIntent("app", "App", (p) => p.includes("/app/id") || /\/id\d+/.test(p))],
  },
  {
    type: "play-store",
    label: "Play Store",
    description: "Google Play app page.",
    collection: "apps",
    category: "app",
    hosts: ["play.google.com"],
    intents: [urlIntent("app", "App", (p) => p.includes("/store/apps/"))],
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
      urlIntent("album", "Album", (p) => p.includes("/album/")),
      urlIntent("artist", "Artist", (p) => p.includes("/artist/")),
      urlIntent("playlist", "Playlist", (p) => p.includes("/playlist/")),
      urlIntent("song", "Song", (p) => p.includes("/song/")),
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
      urlIntent("playlist", "Playlist", (p) => p.includes("/sets/")),
      urlIntent("track", "Track", (p) => isSoundCloudTrackPath(p)),
      urlIntent("user", "User", (p) => isSoundCloudUserPath(p)),
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
    hosts: ["maps.google.com", "maps.app.goo.gl"],
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
    type: "calendly",
    label: "Calendly",
    description: "Profile, event, one-off, or collective link.",
    collection: "business",
    category: "business",
    hosts: ["calendly.com"],
    brandIconId: "calendly",
    defaultIntentId: "event",
    intents: [
      urlIntent("one-off", "One-off", (p) => isCalendlyOneOffPath(p)),
      urlIntent("collective", "Collective", (p) => isCalendlyCollectivePath(p)),
      urlIntent("event", "Event", (p) => isCalendlyEventPath(p)),
      urlIntent("profile", "Profile", (p) => isCalendlyProfilePath(p)),
    ],
  },
  {
    type: "cal-com",
    label: "Cal.com",
    description: "User, event, team, or private booking link.",
    collection: "business",
    category: "business",
    hosts: ["cal.com"],
    brandIconId: "calendly",
    defaultIntentId: "event",
    intents: [
      urlIntent("private", "Private link", (p) => isCalComPrivatePath(p)),
      urlIntent("team", "Team event", (p) => isCalComTeamPath(p)),
      urlIntent("event", "Event", (p) => isCalComEventPath(p)),
      urlIntent("user", "User", (p) => isCalComUserPath(p)),
    ],
  },
  {
    type: "booking-com",
    label: "Booking.com",
    description: "Hotel or share link.",
    collection: "business",
    category: "business",
    hosts: ["booking.com"],
    brandIconId: "booking-com",
    defaultIntentId: "hotel",
    intents: [
      urlIntent("share", "Share", (p) => isBookingComSharePath(p)),
      urlIntent("hotel", "Hotel", (p) => isBookingComHotelPath(p)),
    ],
  },
  {
    type: "acuity",
    label: "Acuity",
    description: "Schedule or appointment link.",
    collection: "business",
    category: "business",
    hosts: ["acuityscheduling.com", "as.me"],
    brandIconId: "calendly",
    defaultIntentId: "schedule",
    intents: [
      urlIntent("appointment", "Appointment", (p, params) => isAcuityAppointmentPath(p, params)),
      urlIntent("schedule", "Schedule", (p, _params, hostname) =>
        isAcuitySchedulePath(p, hostname ?? ""),
      ),
    ],
  },
  {
    type: "stripe",
    label: "Stripe",
    description: "Pay, book, donate, or checkout link.",
    collection: "business",
    category: "business",
    hosts: ["buy.stripe.com", "book.stripe.com", "donate.stripe.com", "checkout.stripe.com"],
    brandIconId: "stripe",
    defaultIntentId: "pay",
    intents: [
      urlIntent("checkout", "Checkout", (_p, _params, hostname) => hostname === "checkout.stripe.com"),
      urlIntent("donate", "Donate", (_p, _params, hostname) => hostname === "donate.stripe.com"),
      urlIntent("book", "Book", (_p, _params, hostname) => hostname === "book.stripe.com"),
      urlIntent("pay", "Pay", (_p, _params, hostname) => hostname === "buy.stripe.com"),
    ],
  },
  {
    type: "razorpay",
    label: "Razorpay",
    description: "Payment link or invoice.",
    collection: "business",
    category: "business",
    hosts: ["rzp.io", "razorpay.com"],
    brandIconId: "razorpay",
    defaultIntentId: "link",
    intents: [
      urlIntent("invoice", "Invoice", (p, _params, hostname) =>
        isRazorpayInvoicePath(p, hostname ?? ""),
      ),
      urlIntent("link", "Payment link", (p, _params, hostname) =>
        isRazorpayShortLinkPath(p, hostname ?? ""),
      ),
    ],
  },
  {
    type: "square",
    label: "Square",
    description: "Checkout or pay link.",
    collection: "business",
    category: "business",
    hosts: ["square.link", "squareup.com"],
    brandIconId: "square",
    defaultIntentId: "checkout",
    intents: [
      urlIntent("pay", "Pay", (p, _params, hostname) => isSquarePayPath(p, hostname ?? "")),
      urlIntent("checkout", "Checkout", (_p, _params, hostname) => hostname === "square.link"),
    ],
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
        fields: [urlField(), { key: "amount", kind: "text", label: "Amount (optional)", required: false }],
        build: (values) => {
          const url = normalizeUrl(stringFieldValue(values, "url"))
          const amount = stringFieldValue(values, "amount")
          if (!amount) {
            return url
          }

          return url.endsWith("/") ? `${url}${amount}` : `${url}/${amount}`
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
      urlIntent("payment", "Payment", (p, params) => isVenmoPaymentPath(p, params)),
      urlIntent("profile", "Profile", (p, params) => isVenmoProfilePath(p, params)),
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
      urlIntent("cashtag", "Cashtag", (p) => p.includes("/$")),
    ],
  },
  {
    type: "google-forms",
    label: "Google Forms",
    description: "Short or full Google Forms link.",
    collection: "business",
    category: "business",
    hosts: ["forms.gle", "docs.google.com"],
    brandIconId: "google",
    defaultIntentId: "form",
    matchHost: (hostname, pathname) => isGoogleFormsHost(hostname, pathname),
    intents: [
      urlIntent("short", "Short link", (_p, _params, hostname) => isGoogleFormsShortHost(hostname ?? "")),
      urlIntent("form", "Form", (p) => isGoogleFormsFullPath(p)),
    ],
  },
  {
    type: "microsoft-forms",
    label: "Microsoft Forms",
    description: "Form or response page link.",
    collection: "business",
    category: "business",
    hosts: ["forms.office.com", "forms.microsoft.com"],
    brandIconId: "microsoft",
    defaultIntentId: "form",
    intents: [
      urlIntent("page", "Response page", (p) => isMicrosoftFormsPagePath(p)),
      urlIntent("form", "Form", (p) => isMicrosoftFormsShortPath(p)),
    ],
  },
  {
    type: "typeform",
    label: "Typeform",
    description: "Typeform survey link.",
    collection: "business",
    category: "business",
    hosts: ["typeform.com", "form.typeform.com"],
    defaultIntentId: "form",
    intents: [urlIntent("form", "Form", (p) => isTypeformPath(p))],
  },
  {
    type: "tally",
    label: "Tally",
    description: "Tally form link.",
    collection: "business",
    category: "business",
    hosts: ["tally.so"],
    defaultIntentId: "form",
    intents: [urlIntent("form", "Form", (p) => isTallyFormPath(p))],
  },
  {
    type: "jotform",
    label: "Jotform",
    description: "Form or submit link.",
    collection: "business",
    category: "business",
    hosts: ["jotform.com", "form.jotform.com"],
    defaultIntentId: "form",
    intents: [
      urlIntent("submit", "Submit", (p) => isJotformSubmitPath(p)),
      urlIntent("form", "Form", (p, _params, hostname) => isJotformFormHost(hostname ?? "", p)),
    ],
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

  // Developer
  {
    type: "github",
    label: "GitHub",
    description: "User, repo, issue, or gist.",
    collection: "more",
    category: "developer",
    hosts: ["github.com", "gist.github.com"],
    intents: [
      urlIntent("gist", "Gist", (_pathname, _params, hostname) => hostname === "gist.github.com"),
      urlIntent("issue", "Issue", (p) => p.includes("/issues/")),
      urlIntent("repo", "Repository", (p, _params, hostname) =>
        hostname !== "gist.github.com" && isGitHubRepoPath(p),
      ),
      urlIntent("user", "User", (p, _params, hostname) =>
        hostname !== "gist.github.com" && isGitHubUserPath(p),
      ),
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
      urlIntent("issue", "Issue", (p) => p.includes("/-/issues/")),
      urlIntent("project", "Project", (p) => isGitLabProjectPath(p)),
      urlIntent("user", "User", (p) => isGitLabUserPath(p)),
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
      urlIntent("story", "Story", (p) => isMediumStoryPath(p)),
      urlIntent("profile", "Profile", (p) => isMediumProfilePath(p)),
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
      urlIntent("post", "Post", (p) => p.includes("/p/")),
      urlIntent("publication", "Publication", (p) => isSubstackPublicationPath(p)),
    ],
  },
] as const

const PLATFORM_DEF_BY_TYPE = new Map<QrInputType, PlatformDef>(
  PLATFORM_DEFS.map((def) => [def.type, def]),
)

const PLATFORM_TYPES = new Set<QrInputType>(PLATFORM_DEFS.map((def) => def.type))

const LEGACY_PLATFORM_ALIASES: Partial<Record<QrInputType, QrInputType>> = {
  "telegram-username": "telegram",
  "whatsapp-chat": "whatsapp",
  "app-download": "app-store",
  form: "google-forms",
  "booking-link": "calendly",
  "payment-link": "stripe",
}

export const URL_ONLY_ALIAS_TYPES = new Set<QrInputType>([
  "auto",
  "website",
  "app-download",
  "pdf",
  "image",
  "video",
  "document",
  "menu",
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
  if (!def) {
    return "url"
  }

  if (def.defaultIntentId) {
    return def.defaultIntentId
  }

  const preferredIds = [
    "profile",
    "channel",
    "user",
    "username",
    "invite",
    "blog",
    "publication",
    "track",
    "chat",
    "song",
    "url",
  ] as const

  for (const preferredId of preferredIds) {
    if (def.intents.some((intent) => intent.id === preferredId)) {
      return preferredId
    }
  }

  return def.intents[0]?.id ?? "url"
}

function getIntentDef(type: QrInputType, intentId: string): PlatformIntentDef | undefined {
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

  const def = getPlatformDef(resolved)

  for (const field of intent?.fields ?? []) {
    const value = stringFieldValue(values, field.key)
    if (!value || fieldErrors[field.key]) {
      continue
    }

    switch (field.kind) {
      case "url": {
        const hosts = def?.hosts ?? []
        const ok = hosts.length > 0 ? isValidPlatformUrl(value, hosts) : isValidUrl(value)
        if (!ok) {
          fieldErrors[field.key] = platformUrlErrorMessage(intent.label)
        } else if (def && intent.matchPath && isWrongPlatformIntent(value, def, intent)) {
          fieldErrors[field.key] = platformUrlErrorMessage(intent.label)
        }
        break
      }
      case "phone":
        if (!isValidPhone(value)) {
          fieldErrors[field.key] = VALIDATION_MESSAGES.phone
        }
        break
      case "amount":
        if (!isPositiveAmount(value)) {
          fieldErrors[field.key] = VALIDATION_MESSAGES.amount
        }
        break
      default:
        break
    }
  }

  return fieldErrors
}

function isWrongPlatformIntent(
  value: string,
  def: PlatformDef,
  intent: PlatformIntentDef,
): boolean {
  try {
    const parsed = new URL(normalizeUrl(value))
    const pathname = parsed.pathname
    const params = parsed.searchParams
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")

    // Incomplete stubs / bare host still OK while typing.
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) {
      return false
    }

    if (intent.matchPath?.(pathname, params, hostname)) {
      return false
    }

    return def.intents.some(
      (other) =>
        other.id !== intent.id &&
        Boolean(other.matchPath?.(pathname, params, hostname)),
    )
  } catch {
    return false
  }
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

    if (def.matchHost && !def.matchHost(hostname, pathname)) {
      continue
    }

    if (def.type === "tiktok" && (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com")) {
      return {
        type: def.type,
        intent: "video",
        platform: def.type,
        brandIconId: def.brandIconId,
      }
    }

    if (def.type === "github" && hostname === "gist.github.com") {
      return {
        type: def.type,
        intent: "gist",
        platform: def.type,
        brandIconId: def.brandIconId,
      }
    }

    if (def.type === "twitch" && hostname === "clips.twitch.tv") {
      return {
        type: def.type,
        intent: "clip",
        platform: def.type,
        brandIconId: def.brandIconId,
      }
    }

    for (const intent of def.intents) {
      if (intent.matchPath?.(pathname, searchParams, hostname)) {
        return {
          type: def.type,
          intent: intent.id,
          platform: def.type,
          brandIconId: def.brandIconId,
        }
      }
    }

    const fallbackIntent =
      def.intents.find((intent) => intent.id === def.defaultIntentId) ??
      def.intents.find((intent) =>
        ["profile", "blog", "publication", "user", "channel", "username", "invite"].includes(
          intent.id,
        ),
      ) ??
      def.intents[def.intents.length - 1]!

    return {
      type: def.type,
      intent: fallbackIntent.id,
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

  return values
}

export const CONTENT_COLLECTIONS: ReadonlyArray<{
  id: ContentCollectionId
  label: string
  types: readonly QrInputType[]
}> = [
  {
    id: "popular",
    label: "Essentials",
    types: ["link", "text", "phone", "email", "wifi", "vcard", "whatsapp"],
  },
  {
    id: "more",
    label: "More",
    types: ["sms", "map-location", "event", "coupon", "upi", "crypto"],
  },
]

export const PLATFORM_PICKER_TYPES: readonly QrInputType[] = [
  ...new Set(CONTENT_COLLECTIONS.flatMap((collection) => collection.types)),
]

function getIntentLabel(type: QrInputType, intentId: string): string {
  return getIntentDef(type, intentId)?.label ?? intentId
}
