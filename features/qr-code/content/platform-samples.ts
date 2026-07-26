import type { QrInputType } from "@/features/qr-code/content/input-options"
import type { PlatformContentValues } from "@/features/qr-code/content/platform-intents"

function u(path: string) {
  return path.startsWith("http") ? path : `https://${path}`
}

type IntentSamples = Record<string, PlatformContentValues>

const SAMPLES: Partial<Record<QrInputType, IntentSamples>> = {
  instagram: {
    profile: { url: u("instagram.com/") },
    post: { url: u("instagram.com/p/") },
    reel: { url: u("instagram.com/reel/") },
    story: { url: u("instagram.com/stories/") },
    highlight: { url: u("instagram.com/stories/highlights/") },
  },
  x: {
    profile: { url: u("x.com/") },
    status: { url: u("x.com/i/status/") },
    list: { url: u("x.com/i/lists/") },
    community: { url: u("x.com/i/communities/") },
    space: { url: u("x.com/i/spaces/") },
  },
  tiktok: {
    profile: { url: u("www.tiktok.com/@qrafty") },
    video: { url: u("www.tiktok.com/@qrafty/video/") },
    live: { url: u("www.tiktok.com/@qrafty/live") },
  },
  youtube: {
    channel: { url: u("youtube.com/@") },
    video: { url: u("youtube.com/watch?v=") },
    shorts: { url: u("youtube.com/shorts/") },
    playlist: { url: u("youtube.com/playlist?list=") },
    live: { url: u("youtube.com/live/") },
  },
  facebook: {
    profile: { url: u("www.facebook.com/qrafty") },
    page: { url: u("www.facebook.com/pages/") },
    post: { url: u("www.facebook.com/qrafty/posts/") },
    group: { url: u("www.facebook.com/groups/qrafty") },
    event: { url: u("www.facebook.com/events/") },
    reel: { url: u("www.facebook.com/reel/") },
  },
  linkedin: {
    profile: { url: u("linkedin.com/in/") },
    company: { url: u("linkedin.com/company/") },
    post: { url: u("linkedin.com/feed/update/") },
    job: { url: u("linkedin.com/jobs/view/") },
  },
  threads: {
    profile: { url: u("www.threads.net/@qrafty") },
    post: { url: u("www.threads.net/@qrafty/post/") },
  },
  snapchat: {
    add: { url: u("snapchat.com/add/") },
    spotlight: { url: u("snapchat.com/spotlight/") },
    lens: { url: u("snapchat.com/lens/") },
  },
  pinterest: {
    profile: { url: u("www.pinterest.com/qrafty/") },
    pin: { url: u("www.pinterest.com/pin/") },
    board: { url: u("www.pinterest.com/qrafty/board-name/") },
  },
  reddit: {
    user: { url: u("www.reddit.com/u/qrafty") },
    subreddit: { url: u("www.reddit.com/r/qrafty/") },
    post: { url: u("www.reddit.com/r/qrafty/comments/") },
    comment: { url: u("www.reddit.com/r/qrafty/comments/abc123/title/") },
  },
  twitch: {
    channel: { url: u("www.twitch.tv/qrafty") },
    video: { url: u("www.twitch.tv/videos/") },
    clip: { url: u("clips.twitch.tv/") },
  },
  bluesky: {
    profile: { url: u("bsky.app/profile/qrafty.bsky.social") },
    post: { url: u("bsky.app/profile/qrafty.bsky.social/post/") },
  },
  mastodon: {
    profile: { url: u("mastodon.social/@qrafty") },
    post: { url: u("mastodon.social/@qrafty/") },
  },
  tumblr: {
    blog: { url: u("qrafty.tumblr.com/") },
    post: { url: u("qrafty.tumblr.com/post/") },
  },
  whatsapp: {
    chat: { phone: "", message: "" },
    group: { url: u("chat.whatsapp.com/") },
  },
  telegram: {
    username: { url: u("t.me/qrafty") },
    message: { url: u("t.me/qrafty?text="), message: "" },
    channel: { url: u("t.me/s/qrafty") },
    group: { url: u("t.me/+") },
    share: { url: u("t.me/share/url?url=") },
  },
  discord: {
    invite: { url: u("discord.gg/qrafty") },
    server: { url: u("discord.com/channels/123456789012345678") },
    channel: { url: u("discord.com/channels/123456789012345678/987654321098765432") },
  },
  messenger: {
    user: { url: u("m.me/") },
  },
  signal: {
    chat: { url: u("signal.me/#p/") },
  },
  line: {
    profile: { url: u("line.me/ti/p/~qrafty") },
    chat: { url: u("line.me/R/ti/p/@qrafty") },
  },
  skype: {
    chat: { url: u("join.skype.com/invite/") },
    call: { url: "skype:" },
  },
  "app-store": {
    app: { url: u("apps.apple.com/app/id") },
  },
  "play-store": {
    app: { url: u("play.google.com/store/apps/details?id=") },
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
    song: { url: u("music.apple.com/us/song/") },
    album: { url: u("music.apple.com/us/album/") },
    artist: { url: u("music.apple.com/us/artist/") },
    playlist: { url: u("music.apple.com/us/playlist/") },
  },
  soundcloud: {
    track: { url: u("soundcloud.com/qrafty/track-name") },
    user: { url: u("soundcloud.com/qrafty") },
    playlist: { url: u("soundcloud.com/qrafty/sets/") },
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
    profile: { url: u("paypal.me/"), amount: "" },
  },
  venmo: {
    profile: { url: u("venmo.com/u/qrafty") },
    payment: { url: u("venmo.com/u/qrafty?txn=") },
  },
  "cash-app": {
    cashtag: { url: u("cash.app/$") },
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
    user: { url: u("github.com/qrafty") },
    repo: { url: u("github.com/qrafty/qrafty") },
    issue: { url: u("github.com/qrafty/qrafty/issues/") },
    gist: { url: u("gist.github.com/qrafty/") },
  },
  gitlab: {
    user: { url: u("gitlab.com/qrafty") },
    project: { url: u("gitlab.com/qrafty/qrafty") },
    issue: { url: u("gitlab.com/qrafty/qrafty/-/issues/") },
  },
  notion: {
    page: { url: u("notion.so/") },
  },
  medium: {
    profile: { url: u("medium.com/@qrafty") },
    story: { url: u("medium.com/@qrafty/") },
  },
  substack: {
    publication: { url: u("qrafty.substack.com/") },
    post: { url: u("qrafty.substack.com/p/") },
  },
}

export function getIntentSampleValues(
  type: QrInputType,
  intentId: string,
): PlatformContentValues {
  return { ...(SAMPLES[type]?.[intentId] ?? {}) }
}
