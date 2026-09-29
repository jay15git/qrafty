import {
  isBlueskyProfilePath,
  isFacebookProfilePath,
  isMastodonPostPath,
  isMastodonProfilePath,
  isPinterestProfilePath,
  isRedditCommentPath,
  isRedditPostPath,
  isThreadsProfilePath,
  isTikTokLivePath,
  isTikTokProfilePath,
  isTikTokVideoPath,
  isTumblrBlogPath,
  segments,
} from "@/features/qr/content/platform-path-matching";
import type { PlatformDef } from "@/features/qr/content/intents/shared";

export const SOCIAL_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "instagram",
    label: "Instagram",
    category: "social",
    hosts: ["instagram.com"],
    brandIconId: "instagram",
    intents: [
      {
        id: "profile",
        label: "Profile",
        matchPath: (pathname) => {
          const segments = pathname.split("/").filter(Boolean);
          return segments.length <= 1;
        },
      },
      { id: "post", label: "Post", matchPath: (p) => p.includes("/p/") },
      { id: "reel", label: "Reel", matchPath: (p) => p.includes("/reel/") },
      {
        id: "story",
        label: "Story",
        matchPath: (p) => p.includes("/stories/") && !p.includes("/highlights/"),
      },
      {
        id: "highlight",
        label: "Highlight",
        matchPath: (p) => p.includes("/stories/highlights/"),
      },
    ],
  },
  {
    type: "x",
    label: "X",
    category: "social",
    hosts: ["x.com", "twitter.com"],
    brandIconId: "x",
    intents: [
      {
        id: "profile",
        label: "Profile",
        matchPath: (pathname) => {
          const segments = pathname.split("/").filter(Boolean);
          return segments.length <= 1 && !pathname.includes("/status/");
        },
      },
      { id: "status", label: "Post", matchPath: (p) => p.includes("/status/") },
      { id: "list", label: "List", matchPath: (p) => p.includes("/i/lists/") },
      { id: "community", label: "Community", matchPath: (p) => p.includes("/i/communities/") },
      { id: "space", label: "Space", matchPath: (p) => p.includes("/i/spaces/") },
    ],
  },
  {
    type: "tiktok",
    label: "TikTok",
    category: "social",
    hosts: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
    brandIconId: "tiktok",
    intents: [
      { id: "video", label: "Video", matchPath: (p) => isTikTokVideoPath(p) },
      { id: "live", label: "Live", matchPath: (p) => isTikTokLivePath(p) },
      { id: "profile", label: "Profile", matchPath: (p) => isTikTokProfilePath(p) },
    ],
  },
  {
    type: "youtube",
    label: "YouTube",
    category: "social",
    hosts: ["youtube.com", "youtu.be", "m.youtube.com"],
    brandIconId: "youtube",
    intents: [
      {
        id: "channel",
        label: "Channel",
        matchPath: (p) => p.startsWith("/@") || p.startsWith("/channel/") || p.startsWith("/c/"),
      },
      {
        id: "video",
        label: "Video",
        matchPath: (p) =>
          p.includes("/watch") || (p.startsWith("/shorts/") === false && p.includes("/v/")),
      },
      { id: "shorts", label: "Shorts", matchPath: (p) => p.includes("/shorts/") },
      { id: "playlist", label: "Playlist", matchPath: (p) => p.includes("/playlist") },
      { id: "live", label: "Live", matchPath: (p) => p.includes("/live") },
    ],
  },
  {
    type: "facebook",
    label: "Facebook",
    category: "social",
    hosts: ["facebook.com", "fb.com", "m.facebook.com"],
    brandIconId: "facebook",
    intents: [
      {
        id: "page",
        label: "Page",
        matchPath: (p) => p.includes("/pages/") || p.includes("/profile.php"),
      },
      {
        id: "post",
        label: "Post",
        matchPath: (p) =>
          p.includes("/posts/") || p.includes("/permalink/") || p.includes("story.php"),
      },
      { id: "group", label: "Group", matchPath: (p) => p.includes("/groups/") },
      { id: "event", label: "Event", matchPath: (p) => p.includes("/events/") },
      { id: "reel", label: "Reel", matchPath: (p) => p.includes("/reel/") },
      { id: "profile", label: "Profile", matchPath: (p) => isFacebookProfilePath(p) },
    ],
  },
  {
    type: "linkedin",
    label: "LinkedIn",
    category: "social",
    hosts: ["linkedin.com"],
    intents: [
      { id: "profile", label: "Profile", matchPath: (p) => p.includes("/in/") },
      { id: "company", label: "Company", matchPath: (p) => p.includes("/company/") },
      {
        id: "post",
        label: "Post",
        matchPath: (p) => p.includes("/feed/update/") || p.includes("/posts/"),
      },
      { id: "job", label: "Job", matchPath: (p) => p.includes("/jobs/") },
    ],
  },
  {
    type: "threads",
    label: "Threads",
    category: "social",
    hosts: ["threads.net"],
    brandIconId: "threads",
    intents: [
      { id: "post", label: "Post", matchPath: (p) => p.includes("/post/") },
      { id: "profile", label: "Profile", matchPath: (p) => isThreadsProfilePath(p) },
    ],
  },
  {
    type: "snapchat",
    label: "Snapchat",
    category: "social",
    hosts: ["snapchat.com"],
    brandIconId: "snapchat",
    intents: [
      { id: "add", label: "Add", matchPath: (p) => p.includes("/add/") },
      { id: "spotlight", label: "Spotlight", matchPath: (p) => p.includes("/spotlight/") },
      { id: "lens", label: "Lens", matchPath: (p) => p.includes("/lens/") },
    ],
  },
  {
    type: "pinterest",
    label: "Pinterest",
    category: "social",
    hosts: ["pinterest.com"],
    brandIconId: "pinterest",
    intents: [
      { id: "pin", label: "Pin", matchPath: (p) => p.includes("/pin/") },
      {
        id: "board",
        label: "Board",
        matchPath: (p) =>
          p.includes("/board/") || (segments(p).length >= 2 && !p.includes("/pin/")),
      },
      { id: "profile", label: "Profile", matchPath: (p) => isPinterestProfilePath(p) },
    ],
  },
  {
    type: "reddit",
    label: "Reddit",
    category: "social",
    hosts: ["reddit.com", "old.reddit.com"],
    intents: [
      {
        id: "user",
        label: "User",
        matchPath: (p) => p.startsWith("/u/") || p.startsWith("/user/"),
      },
      {
        id: "subreddit",
        label: "Subreddit",
        matchPath: (p) => p.startsWith("/r/") && !p.includes("/comments/"),
      },
      { id: "comment", label: "Comment", matchPath: (p) => isRedditCommentPath(p) },
      { id: "post", label: "Post", matchPath: (p) => isRedditPostPath(p) },
    ],
  },
  {
    type: "twitch",
    label: "Twitch",
    category: "social",
    hosts: ["twitch.tv", "clips.twitch.tv"],
    intents: [
      { id: "video", label: "Video", matchPath: (p) => p.includes("/videos/") },
      { id: "clip", label: "Clip", matchPath: (p) => p.includes("/clip/") },
      { id: "channel", label: "Channel", matchPath: (p) => segments(p).length === 1 },
    ],
  },
  {
    type: "bluesky",
    label: "Bluesky",
    category: "social",
    hosts: ["bsky.app"],
    intents: [
      { id: "post", label: "Post", matchPath: (p) => p.includes("/post/") },
      { id: "profile", label: "Profile", matchPath: (p) => isBlueskyProfilePath(p) },
    ],
  },
  {
    type: "mastodon",
    label: "Mastodon",
    category: "social",
    hosts: [],
    intents: [
      { id: "post", label: "Post", matchPath: (p) => isMastodonPostPath(p) },
      { id: "profile", label: "Profile", matchPath: (p) => isMastodonProfilePath(p) },
    ],
  },
  {
    type: "tumblr",
    label: "Tumblr",
    category: "social",
    hosts: ["tumblr.com"],
    intents: [
      { id: "post", label: "Post", matchPath: (p) => p.includes("/post/") },
      { id: "blog", label: "Blog", matchPath: (p) => isTumblrBlogPath(p) },
    ],
  },
];
