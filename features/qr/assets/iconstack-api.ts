import {
  isValidIconstackSvgMarkup,
  normalizeIconstackSvgMarkup,
} from "@/features/qr/assets/iconstack-svg";

export const ICONSTACK_API_BASE = "https://sglpxftkuzsqdpdhftwv.supabase.co/functions/v1";

/** Server-side search proxy — validates params and rate-limits per client. */
export const ICONSTACK_SEARCH_PATH = "/api/icons/search";

export const ICONSTACK_SELECTION_PREFIX = "iconstack:";

export const ICONSTACK_LIBRARIES = [
  { id: "tabler", label: "Tabler" },
  { id: "lucide", label: "Lucide" },
  { id: "feather", label: "Feather" },
  { id: "heroicons", label: "Heroicons" },
  { id: "phosphor", label: "Phosphor" },
  { id: "material", label: "Material Design" },
  { id: "fluent", label: "Fluent UI" },
  { id: "bootstrap", label: "Bootstrap" },
  { id: "solar", label: "Solar" },
  { id: "iconsax", label: "Iconsax" },
  { id: "radix", label: "Radix" },
  { id: "line", label: "Line" },
  { id: "pixelart", label: "Pixel Art" },
  { id: "hugeicon", label: "Huge Icons" },
  { id: "mingcute", label: "Mingcute" },
  { id: "carbon", label: "Carbon" },
  { id: "iconamoon", label: "Iconamoon" },
  { id: "iconoir", label: "Iconoir" },
  { id: "majesticons", label: "Majesticon" },
  { id: "octicons", label: "Octicons" },
  { id: "simple", label: "Simple Icons" },
] as const;

export type IconstackLibraryId = (typeof ICONSTACK_LIBRARIES)[number]["id"];

export type IconstackSearchResult = {
  id: string;
  name: string;
  library: string;
  libraryName: string;
  category: string | null;
  tags: string[];
  style: string;
  url: string;
  score?: number;
};

export type IconstackSearchResponse = {
  query: string;
  total: number;
  limit: number;
  offset: number;
  results: IconstackSearchResult[];
};

export type IconstackSvgResponse = {
  library: string;
  id: string;
  fullId: string;
  svg: string;
  url: string;
};

export type IconstackSearchParams = {
  q: string;
  library?: IconstackLibraryId | "all";
  style?: "outline" | "filled";
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
};

export type IconstackErrorKind = "aborted" | "http" | "invalid" | "network" | "timeout";

export class IconstackApiError extends Error {
  readonly kind: IconstackErrorKind;
  readonly status?: number;

  constructor(kind: IconstackErrorKind, message: string, status?: number) {
    super(message);
    this.name = "IconstackApiError";
    this.kind = kind;
    this.status = status;
  }
}

export function isIconstackAbortError(error: unknown) {
  return error instanceof IconstackApiError && error.kind === "aborted";
}

export function getIconstackErrorMessage(error: unknown) {
  if (error instanceof IconstackApiError) {
    switch (error.kind) {
      case "timeout":
        return "Icon request timed out";
      case "network":
        return "Connection failed — check your network";
      case "http":
        return error.status === 429 ? "Too many requests — try again" : "Icon service unavailable";
      case "invalid":
        return "Icon service returned invalid data";
      case "aborted":
        return "Icon request cancelled";
    }
  }

  return "Icon search failed";
}

const ICONSTACK_REQUEST_TIMEOUT_MS = 10_000;
const ICONSTACK_MAX_QUERY_LENGTH = 80;
const TIMEOUT_ABORT_REASON = "iconstack-timeout";
const CALLER_ABORT_REASON = "iconstack-caller-abort";

async function iconstackFetch(url: string, callerSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(TIMEOUT_ABORT_REASON),
    ICONSTACK_REQUEST_TIMEOUT_MS,
  );
  const onCallerAbort = () => controller.abort(CALLER_ABORT_REASON);

  if (callerSignal) {
    if (callerSignal.aborted) {
      clearTimeout(timeoutId);
      throw new IconstackApiError("aborted", "Iconstack request aborted");
    }
    callerSignal.addEventListener("abort", onCallerAbort, { once: true });
  }

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    const reason = controller.signal.reason;
    if (reason === TIMEOUT_ABORT_REASON) {
      throw new IconstackApiError("timeout", "Iconstack request timed out");
    }
    if (reason === CALLER_ABORT_REASON || callerSignal?.aborted) {
      throw new IconstackApiError("aborted", "Iconstack request aborted");
    }
    throw error instanceof IconstackApiError
      ? error
      : new IconstackApiError("network", "Iconstack request failed");
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}

export function toIconstackSelectionId(result: Pick<IconstackSearchResult, "library" | "id">) {
  const iconId = parseIconstackResultIconId(result);
  return `${ICONSTACK_SELECTION_PREFIX}${result.library}:${iconId}`;
}

export function parseIconstackResultIconId(result: Pick<IconstackSearchResult, "library" | "id">) {
  const prefix = `${result.library}-`;
  if (result.id.startsWith(prefix)) {
    return result.id.slice(prefix.length);
  }

  return result.id;
}

export function parseIconstackSelectionId(
  selectionId?: string,
): { library: string; iconId: string } | null {
  if (!selectionId?.startsWith(ICONSTACK_SELECTION_PREFIX)) {
    return null;
  }

  const payload = selectionId.slice(ICONSTACK_SELECTION_PREFIX.length);
  const separatorIndex = payload.indexOf(":");

  if (separatorIndex <= 0 || separatorIndex === payload.length - 1) {
    return null;
  }

  return {
    library: payload.slice(0, separatorIndex),
    iconId: payload.slice(separatorIndex + 1),
  };
}

const SEARCH_CACHE_LIMIT = 60;

const searchCache = new Map<string, Promise<IconstackSearchResponse>>();

export async function searchIcons({
  q,
  library,
  style,
  limit = 24,
  offset = 0,
  signal,
}: IconstackSearchParams): Promise<IconstackSearchResponse> {
  const params = new URLSearchParams({
    q: q.trim().slice(0, ICONSTACK_MAX_QUERY_LENGTH),
    limit: String(limit),
    offset: String(offset),
  });

  if (library && library !== "all") {
    params.set("library", library);
  }

  if (style) {
    params.set("style", style);
  }

  const cacheKey = params.toString();
  const cached = searchCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const request = iconstackFetch(`${ICONSTACK_SEARCH_PATH}?${cacheKey}`, signal).then(
    async (response) => {
      if (!response.ok) {
        throw new IconstackApiError(
          "http",
          `Iconstack search failed (${response.status})`,
          response.status,
        );
      }

      return (await response.json()) as IconstackSearchResponse;
    },
  );

  searchCache.set(cacheKey, request);

  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey !== undefined) {
      searchCache.delete(oldestKey);
    }
  }

  try {
    return await request;
  } catch (error) {
    searchCache.delete(cacheKey);
    throw error;
  }
}

export async function fetchIconSvg({
  library,
  id,
  signal,
}: {
  library: string;
  id: string;
  signal?: AbortSignal;
}): Promise<IconstackSvgResponse> {
  const params = new URLSearchParams({ library, id });
  const response = await iconstackFetch(
    `${ICONSTACK_API_BASE}/icon-svg?${params.toString()}`,
    signal,
  );

  if (!response.ok) {
    throw new IconstackApiError(
      "http",
      `Iconstack SVG fetch failed (${response.status})`,
      response.status,
    );
  }

  const payload = (await response.json()) as IconstackSvgResponse;
  const svg = normalizeIconstackSvgMarkup(payload.svg ?? "");

  if (!isValidIconstackSvgMarkup(svg)) {
    throw new IconstackApiError(
      "invalid",
      `Iconstack SVG fetch returned invalid markup for ${library}/${id}`,
    );
  }

  return {
    ...payload,
    svg,
  };
}
