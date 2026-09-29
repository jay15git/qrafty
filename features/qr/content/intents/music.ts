import {
  isSoundCloudTrackPath,
  isSoundCloudUserPath,
} from "@/features/qr/content/platform-path-matching";
import type { PlatformDef } from "@/features/qr/content/intents/shared";

export const MUSIC_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "spotify",
    label: "Spotify",
    category: "music",
    hosts: ["open.spotify.com"],
    intents: [
      { id: "track", label: "Track", matchPath: (p) => p.includes("/track/") },
      { id: "album", label: "Album", matchPath: (p) => p.includes("/album/") },
      { id: "artist", label: "Artist", matchPath: (p) => p.includes("/artist/") },
      { id: "playlist", label: "Playlist", matchPath: (p) => p.includes("/playlist/") },
      { id: "show", label: "Show", matchPath: (p) => p.includes("/show/") },
      { id: "episode", label: "Episode", matchPath: (p) => p.includes("/episode/") },
    ],
  },
  {
    type: "apple-music",
    label: "Apple Music",
    category: "music",
    hosts: ["music.apple.com"],
    intents: [
      { id: "album", label: "Album", matchPath: (p) => p.includes("/album/") },
      { id: "artist", label: "Artist", matchPath: (p) => p.includes("/artist/") },
      { id: "playlist", label: "Playlist", matchPath: (p) => p.includes("/playlist/") },
      { id: "song", label: "Song", matchPath: (p) => p.includes("/song/") },
    ],
  },
  {
    type: "soundcloud",
    label: "SoundCloud",
    category: "music",
    hosts: ["soundcloud.com"],
    intents: [
      { id: "playlist", label: "Playlist", matchPath: (p) => p.includes("/sets/") },
      { id: "track", label: "Track", matchPath: (p) => isSoundCloudTrackPath(p) },
      { id: "user", label: "User", matchPath: (p) => isSoundCloudUserPath(p) },
    ],
  },
  {
    type: "youtube-music",
    label: "YouTube Music",
    category: "music",
    hosts: ["music.youtube.com"],
    brandIconId: "youtube",
    intents: [
      { id: "track", label: "Track", matchPath: (p) => p.includes("/watch") },
      { id: "album", label: "Album", matchPath: (p) => p.includes("/playlist") },
      { id: "artist", label: "Artist", matchPath: (p) => p.includes("/channel/") },
      { id: "playlist", label: "Playlist", matchPath: (p) => p.includes("/playlist") },
    ],
  },
  {
    type: "deezer",
    label: "Deezer",
    category: "music",
    hosts: ["deezer.com"],
    intents: [
      { id: "track", label: "Track", matchPath: (p) => p.includes("/track/") },
      { id: "album", label: "Album", matchPath: (p) => p.includes("/album/") },
      { id: "artist", label: "Artist", matchPath: (p) => p.includes("/artist/") },
      { id: "playlist", label: "Playlist", matchPath: (p) => p.includes("/playlist/") },
    ],
  },
];
