import { ICONSTACK_API_BASE, ICONSTACK_LIBRARIES } from "@/features/qr-code/assets/iconstack-api"

export const runtime = "nodejs"

const UPSTREAM_TIMEOUT_MS = 8_000
const MAX_QUERY_LENGTH = 80
const MAX_LIMIT = 64
const MAX_OFFSET = 1000

const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 60_000

const rateBuckets = new Map<string, { count: number; resetAt: number }>()

function clientRateKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  )
}

function consumeRateSlot(key: string) {
  const now = Date.now()
  const bucket = rateBuckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

const VALID_LIBRARIES = new Set<string>(ICONSTACK_LIBRARIES.map((library) => library.id))
const VALID_STYLES = new Set(["outline", "filled"])

export async function GET(request: Request) {
  const rate = consumeRateSlot(clientRateKey(request))
  if (!rate.allowed) {
    return Response.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    )
  }

  const url = new URL(request.url)
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH)
  if (q.length < 2) {
    return Response.json({ error: "Query must be at least 2 characters" }, { status: 400 })
  }

  const params = new URLSearchParams({ q })

  const limit = Number.parseInt(url.searchParams.get("limit") ?? "", 10)
  params.set("limit", String(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), MAX_LIMIT) : 24))

  const offset = Number.parseInt(url.searchParams.get("offset") ?? "", 10)
  params.set("offset", String(Number.isFinite(offset) ? Math.min(Math.max(offset, 0), MAX_OFFSET) : 0))

  const library = url.searchParams.get("library")
  if (library && VALID_LIBRARIES.has(library)) {
    params.set("library", library)
  }

  const style = url.searchParams.get("style")
  if (style && VALID_STYLES.has(style)) {
    params.set("style", style)
  }

  try {
    const upstream = await fetch(`${ICONSTACK_API_BASE}/icon-search?${params.toString()}`, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    })

    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return Response.json({ error: "Icon search upstream unavailable" }, { status: 502 })
  }
}
