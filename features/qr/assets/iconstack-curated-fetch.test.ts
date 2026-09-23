import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchIconSvg } from "@/features/qr/assets/iconstack-api";
import { ICONSTACK_CURATED_ICONS } from "@/features/qr/assets/iconstack-curated";
import { isValidIconstackSvgMarkup } from "@/features/qr/assets/iconstack-svg";

const VALID_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

describe("iconstack curated fetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests every curated icon from the icon-svg endpoint", async () => {
    const requested: { library: string | null; id: string | null; path: string }[] = [];

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = new URL(String(input));
      const library = url.searchParams.get("library");
      const id = url.searchParams.get("id");

      requested.push({ library, id, path: url.pathname });

      return new Response(
        JSON.stringify({
          library,
          id,
          fullId: `${library}-${id}`,
          svg: VALID_SVG,
          url: `https://iconstack.io/icon/${library}/${id}`,
        }),
        { status: 200 },
      );
    });

    const responses = await Promise.all(
      ICONSTACK_CURATED_ICONS.map((icon) => fetchIconSvg({ library: icon.library, id: icon.id })),
    );

    // One request per curated icon, all against the icon-svg endpoint.
    expect(requested).toHaveLength(ICONSTACK_CURATED_ICONS.length);
    expect(requested.every((entry) => entry.path.endsWith("/icon-svg"))).toBe(true);

    // Every curated library/id pair survives URL encoding and reaches the API intact.
    for (const icon of ICONSTACK_CURATED_ICONS) {
      const matched = requested.some(
        (entry) => entry.library === icon.library && entry.id === icon.id,
      );
      expect(matched).toBe(true);
    }

    // The API layer accepts the payload shape it returns for each curated icon.
    for (const [index, response] of responses.entries()) {
      const icon = ICONSTACK_CURATED_ICONS[index];
      expect(response.library).toBe(icon.library);
      expect(response.id).toBe(icon.id);
      expect(isValidIconstackSvgMarkup(response.svg)).toBe(true);
    }
  });
});
