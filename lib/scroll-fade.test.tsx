/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

import { ScrollEdgeCue, useScrollEdges } from "@/lib/scroll-fade";
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root";

function mockScrollBox(
  element: HTMLElement,
  {
    scrollWidth = 0,
    clientWidth = 0,
    scrollLeft = 0,
    scrollHeight = 0,
    clientHeight = 0,
    scrollTop = 0,
  }: {
    scrollWidth?: number;
    clientWidth?: number;
    scrollLeft?: number;
    scrollHeight?: number;
    clientHeight?: number;
    scrollTop?: number;
  },
) {
  Object.defineProperties(element, {
    scrollWidth: { configurable: true, get: () => scrollWidth },
    clientWidth: { configurable: true, get: () => clientWidth },
    scrollLeft: { configurable: true, get: () => scrollLeft },
    scrollHeight: { configurable: true, get: () => scrollHeight },
    clientHeight: { configurable: true, get: () => clientHeight },
    scrollTop: { configurable: true, get: () => scrollTop },
  });
}

function EdgesProbe({
  element,
  axis = "horizontal",
}: {
  element: HTMLElement | null;
  axis?: "horizontal" | "vertical";
}) {
  const edges = useScrollEdges(element, { axis });
  return createElement("div", {
    "data-left": String(edges.left),
    "data-right": String(edges.right),
    "data-top": String(edges.top),
    "data-bottom": String(edges.bottom),
  });
}

describe("ScrollEdgeCue", () => {
  it("renders a CSS fallback gradient class for mobile browsers without color-mix", async () => {
    const container = document.createElement("div");
    container.style.setProperty("--scroll-edge-fade-color", "#07080a");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(ScrollEdgeCue, {
          edge: "right",
          mode: "absolute",
          visible: true,
          chevron: false,
        }),
      );
    });

    const gradient = container.querySelector(".scroll-edge-cue-gradient");
    expect(gradient).not.toBeNull();
    expect(
      getComputedStyle(gradient as Element)
        .getPropertyValue("--scroll-edge-cue-direction")
        .trim(),
    ).toBe("to right");

    await act(async () => {
      root.unmount();
    });
  });
});

describe("useScrollEdges", () => {
  it("rebinds when the scroller node identity changes", () => {
    const overflowing = document.createElement("div");
    mockScrollBox(overflowing, { scrollWidth: 800, clientWidth: 300 });
    const fitted = document.createElement("div");
    mockScrollBox(fitted, { scrollWidth: 300, clientWidth: 300 });

    const { container, rerender } = renderWithJsdomRoot(
      createElement(EdgesProbe, { element: overflowing }),
    );

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("true");
    expect(container.querySelector("[data-left]")?.getAttribute("data-left")).toBe("false");

    rerender(createElement(EdgesProbe, { element: fitted }));

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("false");
  });

  it("attaches after a late-mounted scroller", () => {
    const { container, rerender } = renderWithJsdomRoot(
      createElement(EdgesProbe, { element: null }),
    );

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("false");

    const overflowing = document.createElement("div");
    mockScrollBox(overflowing, { scrollWidth: 800, clientWidth: 300 });
    rerender(createElement(EdgesProbe, { element: overflowing }));

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("true");
  });

  it("uses preview tile tokens instead of stretched offset widths", () => {
    const viewport = document.createElement("div");
    mockScrollBox(viewport, { scrollWidth: 3783, clientWidth: 248, scrollLeft: 245 });

    const host = document.createElement("div");
    host.className = "inspector-root";
    host.style.setProperty("--settings-preview-tile", "3.5rem");
    host.style.setProperty("--space-inline", "0.375rem");

    const inner = document.createElement("div");
    const row = document.createElement("div");
    row.className = "dn-preview-row";

    for (let index = 0; index < 5; index += 1) {
      const tile = document.createElement("button");
      tile.className = "dn-preview-tile dn-preview-tile-size";
      Object.defineProperty(tile, "offsetWidth", {
        configurable: true,
        get: () => 700,
      });
      row.appendChild(tile);
    }

    inner.appendChild(row);
    viewport.appendChild(inner);
    host.appendChild(viewport);
    document.body.appendChild(host);

    const { container } = renderWithJsdomRoot(createElement(EdgesProbe, { element: viewport }));

    expect(container.querySelector("[data-left]")?.getAttribute("data-left")).toBe("false");
    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("false");

    host.remove();
  });

  it("shows the right cue at scroll origin while horizontal layout is still unstable", () => {
    const viewport = document.createElement("div");
    mockScrollBox(viewport, { scrollWidth: 3783, clientWidth: 248, scrollLeft: 0 });

    const host = document.createElement("div");
    host.className = "inspector-root";
    host.style.setProperty("--settings-preview-tile", "3.5rem");
    host.style.setProperty("--space-inline", "0.375rem");

    const inner = document.createElement("div");
    const row = document.createElement("div");
    row.className = "dn-preview-row";

    for (let index = 0; index < 5; index += 1) {
      const tile = document.createElement("button");
      tile.className = "dn-preview-tile dn-preview-tile-size";
      row.appendChild(tile);
    }

    inner.appendChild(row);
    viewport.appendChild(inner);
    host.appendChild(viewport);
    document.body.appendChild(host);

    const { container } = renderWithJsdomRoot(createElement(EdgesProbe, { element: viewport }));

    expect(container.querySelector("[data-left]")?.getAttribute("data-left")).toBe("false");
    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("true");

    host.remove();
  });

  it("shows the right cue once horizontal layout is stable", () => {
    const viewport = document.createElement("div");
    mockScrollBox(viewport, { scrollWidth: 300, clientWidth: 248, scrollLeft: 0 });

    const host = document.createElement("div");
    host.className = "inspector-root";
    host.style.setProperty("--settings-preview-tile", "3.5rem");
    host.style.setProperty("--space-inline", "0.375rem");

    const inner = document.createElement("div");
    const row = document.createElement("div");
    row.className = "dn-preview-row";

    for (let index = 0; index < 5; index += 1) {
      const tile = document.createElement("button");
      tile.className = "dn-preview-tile dn-preview-tile-size";
      row.appendChild(tile);
    }

    inner.appendChild(row);
    viewport.appendChild(inner);
    host.appendChild(viewport);
    document.body.appendChild(host);

    const { container } = renderWithJsdomRoot(createElement(EdgesProbe, { element: viewport }));

    expect(container.querySelector("[data-left]")?.getAttribute("data-left")).toBe("false");
    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("true");

    host.remove();
  });

  it.each([
    { scrollWidth: 730, clientWidth: 248, scrollLeft: 0, left: false, right: true },
    { scrollWidth: 730, clientWidth: 248, scrollLeft: 200, left: true, right: true },
    { scrollWidth: 730, clientWidth: 248, scrollLeft: 482, left: true, right: false },
    { scrollWidth: 730, clientWidth: 248, scrollLeft: 481.5, left: true, right: false },
    { scrollWidth: 730, clientWidth: 248, scrollLeft: 492, left: true, right: false },
    { scrollWidth: 730, clientWidth: 248, scrollLeft: -10, left: false, right: true },
    { scrollWidth: 780, clientWidth: 780, scrollLeft: 0, left: false, right: false },
  ])(
    "uses native horizontal bounds at $scrollLeft with viewport width $clientWidth",
    ({ scrollWidth, clientWidth, scrollLeft, left, right }) => {
      const viewport = document.createElement("div");
      const host = document.createElement("div");
      host.className = "inspector-root";
      host.style.setProperty("--settings-preview-tile", "56px");
      host.style.setProperty("--space-inline", "6px");
      const inner = document.createElement("div");
      const row = document.createElement("div");
      row.className = "dn-preview-row";
      row.style.padding = "6px 4px";
      for (let index = 0; index < 13; index += 1) {
        const tile = document.createElement("button");
        tile.style.marginInline = "-3px";
        row.appendChild(tile);
      }
      inner.appendChild(row);
      viewport.appendChild(inner);
      host.appendChild(viewport);
      document.body.appendChild(host);
      mockScrollBox(viewport, { scrollWidth, clientWidth, scrollLeft: 0 });
      const { container } = renderWithJsdomRoot(createElement(EdgesProbe, { element: viewport }));
      act(() => {
        mockScrollBox(viewport, { scrollWidth, clientWidth, scrollLeft });
        viewport.dispatchEvent(new Event("scroll"));
      });
      expect(container.querySelector("[data-left]")?.getAttribute("data-left")).toBe(String(left));
      expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe(
        String(right),
      );
      host.remove();
    },
  );
});
