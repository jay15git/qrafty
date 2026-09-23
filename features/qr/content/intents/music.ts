import {
  isSoundCloudTrackPath,
  isSoundCloudUserPath,
} from "@/features/qr/content/platform-path-matching"
import {
  urlIntent,
  type PlatformDef,
} from "@/features/qr/content/intents/shared"

export const MUSIC_PLATFORM_DEFS: readonly PlatformDef[] = [
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
]
