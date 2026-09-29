import {
  isGitHubRepoPath,
  isGitHubUserPath,
  isGitLabProjectPath,
  isGitLabUserPath,
  isMediumProfilePath,
  isMediumStoryPath,
  isSubstackPublicationPath,
} from "@/features/qr/content/platform-path-matching";
import type { PlatformDef } from "@/features/qr/content/intents/shared";

export const DEVELOPER_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "github",
    label: "GitHub",
    category: "developer",
    hosts: ["github.com", "gist.github.com"],
    intents: [
      {
        id: "gist",
        label: "Gist",
        matchPath: (_pathname, _params, hostname) => hostname === "gist.github.com",
      },
      { id: "issue", label: "Issue", matchPath: (p) => p.includes("/issues/") },
      {
        id: "repo",
        label: "Repository",
        matchPath: (p, _params, hostname) => hostname !== "gist.github.com" && isGitHubRepoPath(p),
      },
      {
        id: "user",
        label: "User",
        matchPath: (p, _params, hostname) => hostname !== "gist.github.com" && isGitHubUserPath(p),
      },
    ],
  },
  {
    type: "gitlab",
    label: "GitLab",
    category: "developer",
    hosts: ["gitlab.com"],
    intents: [
      { id: "issue", label: "Issue", matchPath: (p) => p.includes("/-/issues/") },
      { id: "project", label: "Project", matchPath: (p) => isGitLabProjectPath(p) },
      { id: "user", label: "User", matchPath: (p) => isGitLabUserPath(p) },
    ],
  },
  {
    type: "notion",
    label: "Notion",
    category: "developer",
    hosts: ["notion.so", "notion.site"],
    intents: [{ id: "page", label: "Page" }],
  },
  {
    type: "medium",
    label: "Medium",
    category: "developer",
    hosts: ["medium.com"],
    intents: [
      { id: "story", label: "Story", matchPath: (p) => isMediumStoryPath(p) },
      { id: "profile", label: "Profile", matchPath: (p) => isMediumProfilePath(p) },
    ],
  },
  {
    type: "substack",
    label: "Substack",
    category: "developer",
    hosts: ["substack.com"],
    intents: [
      { id: "post", label: "Post", matchPath: (p) => p.includes("/p/") },
      { id: "publication", label: "Publication", matchPath: (p) => isSubstackPublicationPath(p) },
    ],
  },
];
