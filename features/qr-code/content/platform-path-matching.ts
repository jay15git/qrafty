export function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean)
}

export function excludes(pathname: string, substrings: readonly string[]): boolean {
  return !substrings.some((substring) => pathname.includes(substring))
}

export function isSingleSegmentPath(pathname: string): boolean {
  return segments(pathname).length === 1
}

export function discordChannelSegmentCount(pathname: string): number | null {
  if (!pathname.includes("/channels/")) {
    return null
  }

  const afterChannels = pathname.split("/channels/")[1]
  if (!afterChannels) {
    return null
  }

  return segments(`/${afterChannels}`).length
}

export function isDiscordServerPath(pathname: string): boolean {
  return discordChannelSegmentCount(pathname) === 1
}

export function isDiscordChannelPath(pathname: string): boolean {
  const count = discordChannelSegmentCount(pathname)
  return count !== null && count >= 2
}

const TIKTOK_PROFILE_EXCLUSIONS = ["/video/", "/t/", "/live"] as const

export function isTikTokProfilePath(pathname: string): boolean {
  if (!excludes(pathname, TIKTOK_PROFILE_EXCLUSIONS)) {
    return false
  }

  const parts = segments(pathname)
  if (parts.length === 0) {
    return true
  }

  return parts.length === 1 && parts[0]!.startsWith("@")
}

export function isTikTokVideoPath(pathname: string): boolean {
  return pathname.includes("/video/") || pathname.includes("/t/")
}

export function isTikTokLivePath(pathname: string): boolean {
  return pathname.includes("/live")
}

const FACEBOOK_PROFILE_EXCLUSIONS = [
  "/pages/",
  "/posts/",
  "/groups/",
  "/events/",
  "/reel/",
  "permalink",
  "profile.php",
  "story.php",
] as const

export function isFacebookProfilePath(pathname: string): boolean {
  return isSingleSegmentPath(pathname) && excludes(pathname, FACEBOOK_PROFILE_EXCLUSIONS)
}

export function isThreadsProfilePath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 1 && parts[0]!.startsWith("@")
}

export function isPinterestProfilePath(pathname: string): boolean {
  return isSingleSegmentPath(pathname) && !pathname.includes("/pin/")
}

export function isBlueskyProfilePath(pathname: string): boolean {
  return pathname.includes("/profile/") && !pathname.includes("/post/")
}

export function isMastodonProfilePath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 1 && parts[0]!.startsWith("@")
}

export function isMastodonPostPath(pathname: string): boolean {
  const parts = segments(pathname)
  return (
    parts.length === 2 &&
    parts[0]!.startsWith("@") &&
    /^\d+$/.test(parts[1] ?? "")
  )
}

export function isTumblrBlogPath(pathname: string): boolean {
  return !pathname.includes("/post/")
}

export function isSoundCloudUserPath(pathname: string): boolean {
  return isSingleSegmentPath(pathname)
}

export function isSoundCloudTrackPath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 2 && !pathname.includes("/sets/")
}

export function isGitHubUserPath(pathname: string): boolean {
  return isSingleSegmentPath(pathname)
}

export function isGitHubRepoPath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 2 && !pathname.includes("/issues/")
}

export function isGitLabUserPath(pathname: string): boolean {
  return isSingleSegmentPath(pathname)
}

export function isGitLabProjectPath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 2 && !pathname.includes("/-/issues/")
}

export function isMediumProfilePath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 1 && parts[0]!.startsWith("@")
}

export function isMediumStoryPath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length >= 2 && parts[0]!.startsWith("@")
}

export function isSubstackPublicationPath(pathname: string): boolean {
  return !pathname.includes("/p/")
}

export function isVenmoProfilePath(pathname: string, searchParams: URLSearchParams): boolean {
  return pathname.includes("/u/") && !searchParams.has("txn") && !pathname.includes("/pay/")
}

export function isVenmoPaymentPath(pathname: string, searchParams: URLSearchParams): boolean {
  return searchParams.has("txn") || pathname.includes("/pay/")
}

export function redditSegmentsAfterComments(pathname: string): number {
  const parts = segments(pathname)
  const commentsIndex = parts.indexOf("comments")
  if (commentsIndex < 0) {
    return 0
  }

  return parts.length - commentsIndex - 1
}

export function isRedditPostPath(pathname: string): boolean {
  if (!pathname.includes("/comments/")) {
    return false
  }

  const depth = redditSegmentsAfterComments(pathname)
  return depth >= 2 && depth < 3
}

export function isRedditCommentPath(pathname: string): boolean {
  return pathname.includes("/comments/") && redditSegmentsAfterComments(pathname) >= 3
}

export function isGoogleFormsHost(hostname: string, pathname: string): boolean {
  return hostname === "forms.gle" || pathname.includes("/forms/")
}

export function isGoogleFormsShortHost(hostname: string): boolean {
  return hostname === "forms.gle"
}

export function isGoogleFormsFullPath(pathname: string): boolean {
  return (
    pathname.includes("/forms/") &&
    (pathname.includes("/viewform") || pathname.includes("/forms/d/"))
  )
}

export function isMicrosoftFormsPagePath(pathname: string): boolean {
  return pathname.includes("/Pages/ResponsePage.aspx")
}

export function isMicrosoftFormsShortPath(pathname: string): boolean {
  return pathname.startsWith("/r/")
}

export function isTypeformPath(pathname: string): boolean {
  return pathname.includes("/to/")
}

export function isTallyFormPath(pathname: string): boolean {
  return pathname.startsWith("/r/")
}

export function isJotformSubmitPath(pathname: string): boolean {
  return pathname.includes("/submit/")
}

export function isJotformFormHost(hostname: string, pathname: string): boolean {
  return hostname === "form.jotform.com" || /^\/?\d+/.test(pathname)
}

export function isCalendlyOneOffPath(pathname: string): boolean {
  return pathname.startsWith("/d/")
}

export function isCalendlyCollectivePath(pathname: string): boolean {
  return pathname.startsWith("/c/")
}

export function isCalendlyProfilePath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 1 && !pathname.startsWith("/d/") && !pathname.startsWith("/c/")
}

export function isCalendlyEventPath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length >= 2 && !pathname.startsWith("/d/") && !pathname.startsWith("/c/")
}

export function isCalComPrivatePath(pathname: string): boolean {
  return pathname.startsWith("/d/")
}

export function isCalComTeamPath(pathname: string): boolean {
  return pathname.startsWith("/team/")
}

export function isCalComUserPath(pathname: string): boolean {
  return segments(pathname).length === 1
}

export function isCalComEventPath(pathname: string): boolean {
  const parts = segments(pathname)
  return parts.length === 2 && parts[0] !== "team" && parts[0] !== "d"
}

export function isBookingComHotelPath(pathname: string): boolean {
  return pathname.includes("/hotel/")
}

export function isBookingComSharePath(pathname: string): boolean {
  return pathname.includes("/Share-")
}

export function isAcuityAppointmentPath(pathname: string, searchParams: URLSearchParams): boolean {
  return searchParams.has("appointmentType") || pathname.includes("/appointment/")
}

export function isAcuitySchedulePath(pathname: string, hostname: string): boolean {
  return pathname.includes("/schedule.php") || hostname.endsWith(".as.me")
}

export function isRazorpayInvoicePath(pathname: string, hostname: string): boolean {
  return (
    hostname === "razorpay.com" &&
    (pathname.includes("/invoice/") || pathname.includes("/payment-link/"))
  )
}

export function isRazorpayShortLinkPath(pathname: string, hostname: string): boolean {
  return hostname === "rzp.io" && (pathname.startsWith("/l/") || pathname.startsWith("/i/"))
}

export function isSquarePayPath(pathname: string, hostname: string): boolean {
  return hostname === "squareup.com" && (pathname.includes("/pay/") || pathname.includes("/u/"))
}
