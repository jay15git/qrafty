import { ICONSTACK_API_BASE, ICONSTACK_LIBRARIES } from "@/features/qr/assets/iconstack-api";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_QUERY_LENGTH = 80;
const MAX_LIMIT = 64;
const MAX_OFFSET = 1000;

const VALID_LIBRARIES = new Set<string>(ICONSTACK_LIBRARIES.map((library) => library.id));
const VALID_STYLES = new Set(["outline", "filled"]);

function clampedIntParam(
  searchParams: URLSearchParams,
  key: string,
  min: number,
  max: number,
  fallback: number,
) {
  const parsed = Number.parseInt(searchParams.get(key) ?? "", 10);
  return String(Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback);
}

function buildUpstreamParams(url: URL) {
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  if (q.length < 2) {
    return null;
  }

  const library = url.searchParams.get("library");
  const style = url.searchParams.get("style");

  return new URLSearchParams({
    q,
    limit: clampedIntParam(url.searchParams, "limit", 1, MAX_LIMIT, 24),
    offset: clampedIntParam(url.searchParams, "offset", 0, MAX_OFFSET, 0),
    ...(library && VALID_LIBRARIES.has(library) ? { library } : {}),
    ...(style && VALID_STYLES.has(style) ? { style } : {}),
  });
}

export async function GET(request: Request) {
  const params = buildUpstreamParams(new URL(request.url));
  if (!params) {
    return Response.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${ICONSTACK_API_BASE}/icon-search?${params.toString()}`, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      return Response.json({ error: "Icon search upstream error" }, { status: upstream.status });
    }

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Icon search upstream unavailable" }, { status: 502 });
  }
}
