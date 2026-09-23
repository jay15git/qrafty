import {
  isGitHubRepoPath,
  isGitHubUserPath,
  isGitLabProjectPath,
  isGitLabUserPath,
  isMediumProfilePath,
  isMediumStoryPath,
  isSubstackPublicationPath,
} from "@/features/qr/content/platform-path-matching"
import {
  urlIntent,
  type PlatformDef,
} from "@/features/qr/content/intents/shared"

export const DEVELOPER_PLATFORM_DEFS: readonly PlatformDef[] = [
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
]
