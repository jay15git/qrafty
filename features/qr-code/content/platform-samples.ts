import type { QrInputType } from "@/features/qr-code/content/input-options"
import type { PlatformContentValues } from "@/features/qr-code/content/platform-intents"

function u(path: string) {
  return path.startsWith("http") ? path : `https://${path}`
}

type IntentSamples = Record<string, PlatformContentValues>

const SAMPLES: Partial<Record<QrInputType, IntentSamples>> = {
  instagram: {
    profile: { username: "" },
    post: { id: "", url: u("instagram.com/p/") },
    reel: { id: "", url: u("instagram.com/reel/") },
    story: { url: u("instagram.com/stories/") },
    highlight: { id: "", url: u("instagram.com/stories/highlights/") },
  },
  x: {
    profile: { username: "" },
    status: { url: u("x.com/i/status/") },
    list: { url: u("x.com/i/lists/") },
    community: { url: u("x.com/i/communities/") },
    space: { url: u("x.com/i/spaces/") },
  },
  tiktok: {
    profile: { username: "", url: u("tiktok.com/@") },
    video: { url: u("tiktok.com/@") },
    live: { url: u("tiktok.com/@") },
  },
  youtube: {
    channel: { username: "", url: u("youtube.com/@") },
    video: { url: u("youtube.com/watch?v=") },
    shorts: { url: u("youtube.com/shorts/") },
    playlist: { url: u("youtube.com/playlist?list=") },
    live: { url: u("youtube.com/live/") },
  },
  facebook: {
    profile: { url: u("facebook.com/") },
    page: { url: u("facebook.com/") },
    post: { url: u("facebook.com/") },
    group: { url: u("facebook.com/groups/") },
    event: { url: u("facebook.com/events/") },
    reel: { url: u("facebook.com/reel/") },
  },
  linkedin: {
    profile: { url: u("linkedin.com/in/") },
    company: { url: u("linkedin.com/company/") },
    post: { url: u("linkedin.com/feed/update/") },
    job: { url: u("linkedin.com/jobs/view/") },
  },
  threads: {
    profile: { username: "", url: u("threads.net/@") },
    post: { url: u("threads.net/@") },
  },
  snapchat: {
    add: { username: "", url: u("snapchat.com/add/") },
    spotlight: { url: u("snapchat.com/spotlight/") },
    lens: { url: u("snapchat.com/lens/") },
  },
  pinterest: {
    profile: { username: "", url: u("pinterest.com/") },
    pin: { url: u("pinterest.com/pin/") },
    board: { url: u("pinterest.com/") },
  },
  reddit: {
    user: { username: "", url: u("reddit.com/u/") },
    subreddit: { url: u("reddit.com/r/") },
    post: { url: u("reddit.com/r/") },
    comment: { url: u("reddit.com/r/") },
  },
  twitch: {
    channel: { username: "", url: u("twitch.tv/") },
    video: { url: u("twitch.tv/videos/") },
    clip: { url: u("twitch.tv/") },
  },
  bluesky: {
    profile: { url: u("bsky.app/profile/") },
    post: { url: u("bsky.app/profile/") },
  },
  mastodon: {
    profile: { instance: "", username: "" },
    post: { url: u("https://") },
  },
  tumblr: {
    blog: { username: "" },
    post: { url: u("https://") },
  },
  whatsapp: {
    chat: { phone: "", message: "" },
    group: { url: u("chat.whatsapp.com/") },
  },
  telegram: {
    username: { username: "", url: u("t.me/") },
    message: { username: "", message: "" },
    channel: { url: u("t.me/") },
    group: { url: u("t.me/+") },
    share: { url: u("t.me/share/url?url=") },
  },
  discord: {
    invite: { url: u("discord.gg/") },
    server: { url: u("discord.com/channels/") },
    channel: { url: u("discord.com/channels/") },
  },
  messenger: {
    user: { url: u("m.me/") },
  },
  signal: {
    chat: { url: u("signal.me/#p/") },
  },
  line: {
    profile: { url: u("line.me/ti/p/") },
    chat: { url: u("line.me/ti/p/") },
  },
  skype: {
    chat: { url: u("join.skype.com/invite/") },
    call: { url: "skype:" },
  },
  "app-store": {
    app: { id: "", url: u("apps.apple.com/app/id") },
  },
  "play-store": {
    app: { id: "", url: u("play.google.com/store/apps/details?id=") },
  },
  "microsoft-store": {
    app: { url: u("apps.microsoft.com/detail/") },
  },
  "amazon-appstore": {
    app: { url: u("www.amazon.com/dp/") },
  },
  "huawei-appgallery": {
    app: { url: u("appgallery.huawei.com/app/") },
  },
  spotify: {
    track: { url: u("open.spotify.com/track/") },
    album: { url: u("open.spotify.com/album/") },
    artist: { url: u("open.spotify.com/artist/") },
    playlist: { url: u("open.spotify.com/playlist/") },
    show: { url: u("open.spotify.com/show/") },
    episode: { url: u("open.spotify.com/episode/") },
  },
  "apple-music": {
    song: { url: u("music.apple.com/") },
    album: { url: u("music.apple.com/") },
    artist: { url: u("music.apple.com/") },
    playlist: { url: u("music.apple.com/") },
  },
  soundcloud: {
    track: { url: u("soundcloud.com/") },
    user: { username: "" },
    playlist: { url: u("soundcloud.com/") },
  },
  "youtube-music": {
    track: { url: u("music.youtube.com/watch?v=") },
    album: { url: u("music.youtube.com/playlist?list=") },
    artist: { url: u("music.youtube.com/channel/") },
    playlist: { url: u("music.youtube.com/playlist?list=") },
  },
  deezer: {
    track: { url: u("deezer.com/track/") },
    album: { url: u("deezer.com/album/") },
    artist: { url: u("deezer.com/artist/") },
    playlist: { url: u("deezer.com/playlist/") },
  },
  "map-location": {
    place: { query: "", latitude: "", longitude: "" },
    directions: { url: u("maps.google.com/dir/?api=1&destination=") },
    coords: { latitude: "", longitude: "", query: "" },
  },
  "apple-maps": {
    place: { url: u("maps.apple.com/?q=") },
    directions: { url: u("maps.apple.com/?daddr=") },
  },
  waze: {
    place: { url: u("waze.com/ul?q=") },
    navigate: { url: u("waze.com/ul?navigate=yes&q=") },
  },
  "google-review": {
    place: { url: u("g.page/") },
  },
  "booking-link": {
    url: { url: u("https://") },
  },
  calendly: {
    event: { url: u("calendly.com/") },
  },
  "payment-link": {
    url: { url: u("https://") },
  },
  "paypal-me": {
    profile: { username: "", amount: "" },
  },
  venmo: {
    profile: { username: "" },
    payment: { url: u("venmo.com/") },
  },
  "cash-app": {
    cashtag: { username: "" },
  },
  menu: {
    url: { url: u("https://") },
  },
  form: {
    url: { url: u("https://") },
  },
  zoom: {
    meeting: { url: u("zoom.us/j/") },
  },
  "google-meet": {
    meeting: { url: u("meet.google.com/") },
  },
  "microsoft-teams": {
    meeting: { url: u("teams.microsoft.com/l/meetup-join/") },
  },
  pdf: {
    url: { url: u("https://") },
  },
  image: {
    url: { url: u("https://") },
  },
  video: {
    url: { url: u("https://") },
  },
  document: {
    url: { url: u("https://") },
  },
  website: {
    url: { url: u("https://") },
  },
  github: {
    user: { username: "" },
    repo: { url: u("github.com/") },
    issue: { url: u("github.com/") },
    gist: { url: u("gist.github.com/") },
  },
  gitlab: {
    user: { username: "" },
    project: { url: u("gitlab.com/") },
    issue: { url: u("gitlab.com/") },
  },
  notion: {
    page: { url: u("notion.so/") },
  },
  medium: {
    profile: { username: "" },
    story: { url: u("medium.com/@") },
  },
  substack: {
    publication: { url: u("https://") },
    post: { url: u("https://") },
  },
}

export function getIntentSampleValues(
  type: QrInputType,
  intentId: string,
): PlatformContentValues {
  return { ...(SAMPLES[type]?.[intentId] ?? {}) }
}
