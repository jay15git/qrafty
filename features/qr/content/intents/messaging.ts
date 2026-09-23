import {
  normalizeUrl,
  stringFieldValue,
} from "@/features/qr/content/platform-builders"
import {
  isDiscordChannelPath,
  isDiscordServerPath,
  segments,
} from "@/features/qr/content/platform-path-matching"
import {
  textField,
  urlField,
  urlIntent,
  type PlatformDef,
} from "@/features/qr/content/intents/shared"

export const MESSAGING_PLATFORM_DEFS: readonly PlatformDef[] = [
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
          { key: "phone", kind: "phone", label: "Phone number", required: true },
          textField("message", "Message"),
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
]
