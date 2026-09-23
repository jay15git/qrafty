import { describe, expect, it } from "vitest";

import { isBlobUrl, isDataUrl } from "./assets";

describe("assets", () => {
  it("detects blob and data urls", () => {
    expect(isBlobUrl("blob:http://localhost/abc")).toBe(true);
    expect(isDataUrl("data:image/png;base64,abc")).toBe(true);
    expect(isBlobUrl("https://example.com/a.png")).toBe(false);
  });
});
