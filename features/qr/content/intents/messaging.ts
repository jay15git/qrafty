import {
  isDiscordChannelPath,
  isDiscordServerPath,
  segments,
} from "@/features/qr/content/platform-path-matching";
import type { PlatformDef } from "@/features/qr/content/intents/shared";

export const MESSAGING_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "whatsapp",
    label: "WhatsApp",
    category: "messaging",
    hosts: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com"],
    brandIconId: "whatsapp",
    intents: [
      { id: "chat", label: "Chat", matchPath: (_, params) => !params.get("invite") },
      { id: "group", label: "Group invite", matchPath: (p) => p.includes("chat.whatsapp.com") },
    ],
  },
  {
    type: "telegram",
    label: "Telegram",
    category: "messaging",
    hosts: ["t.me", "telegram.me", "telegram.dog"],
    brandIconId: "telegram",
    intents: [
      {
        id: "channel",
        label: "Channel",
        matchPath: (p) => p.startsWith("/c/") || p.includes("/s/"),
      },
      {
        id: "group",
        label: "Group",
        matchPath: (p) => p.includes("+") || p.includes("joinchat"),
      },
      { id: "share", label: "Share", matchPath: (p) => p.includes("/share/") },
      {
        id: "username",
        label: "Username",
        matchPath: (p, params) => {
          const seg = segments(p);
          return (
            seg.length === 1 && !p.includes("+") && !p.includes("joinchat") && !params.has("text")
          );
        },
      },
      {
        id: "message",
        label: "Message",
        matchPath: (p, params) => segments(p).length === 1 && params.has("text"),
      },
    ],
  },
  {
    type: "discord",
    label: "Discord",
    category: "messaging",
    hosts: ["discord.gg", "discord.com"],
    brandIconId: "discord",
    intents: [
      {
        id: "invite",
        label: "Invite",
        matchPath: (p) => p.includes("/invite") || /^\/[A-Za-z0-9]+$/.test(p),
      },
      { id: "channel", label: "Channel", matchPath: (p) => isDiscordChannelPath(p) },
      { id: "server", label: "Server", matchPath: (p) => isDiscordServerPath(p) },
    ],
  },
  {
    type: "messenger",
    label: "Messenger",
    category: "messaging",
    hosts: ["m.me", "messenger.com"],
    intents: [{ id: "user", label: "User" }],
  },
  {
    type: "signal",
    label: "Signal",
    category: "messaging",
    hosts: ["signal.me"],
    intents: [{ id: "chat", label: "Chat" }],
  },
  {
    type: "line",
    label: "Line",
    category: "messaging",
    hosts: ["line.me"],
    intents: [
      { id: "chat", label: "Chat", matchPath: (p) => p.includes("/R/ti/p/") },
      {
        id: "profile",
        label: "Profile",
        matchPath: (p) => p.includes("/ti/p/") && !p.includes("/R/ti/p/"),
      },
    ],
  },
  {
    type: "skype",
    label: "Skype",
    category: "messaging",
    hosts: ["join.skype.com", "skype.com"],
    intents: [
      { id: "chat", label: "Chat", matchPath: (p) => p.includes("/chat") },
      { id: "call", label: "Call", matchPath: (p) => p.includes("/call") || p.includes("skype:") },
    ],
  },
];
