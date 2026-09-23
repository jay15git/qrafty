// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MobileCardRail,
  MobileSettingsRail,
  SettingsOptionShelf,
} from "@/features/shell/inspector/MobileSettingsRail";
import { MobileInspectorDensityContext } from "@/features/shell/inspector/MobileInspectorDensityContext";
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root";

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function Options() {
  return (
    <>
      <button aria-pressed={false} type="button">
        One
      </button>
      <button aria-pressed type="button">
        Two
      </button>
    </>
  );
}

describe("mobile settings rails", () => {
  beforeEach(() => {
    stubMatchMedia(true);

    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    });
  });

  it("renders a shelf as a horizontal rail under mobile density", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <SettingsOptionShelf
          activeKey="Two"
          ariaLabel="Fill options"
          dataSlot="fill-option-grid"
          label="Presets"
        >
          <Options />
        </SettingsOptionShelf>
      </MobileInspectorDensityContext.Provider>,
    );

    const rail = surface.container.querySelector('[data-slot="mobile-settings-rail"]');

    expect(rail).not.toBeNull();
    expect(rail?.getAttribute("data-orientation")).toBe("horizontal");
    expect(surface.container.querySelector('[data-slot="fill-option-grid"]')).not.toBeNull();
    expect(surface.container.textContent).toContain("Presets");
    expect(surface.container.querySelector(".dn-settings-shelf")).not.toBeNull();

    const row = rail?.querySelector(".dn-mobile-rail");
    expect(row).not.toBeNull();
    expect(row?.querySelectorAll("button")).toHaveLength(2);
    expect(row?.getAttribute("role")).toBe("group");
    expect(row?.getAttribute("aria-label")).toBe("Fill options");
  });

  it("keeps the fixed-column grid when mobile density is off", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={false}>
        <SettingsOptionShelf
          ariaLabel="Fill options"
          dataSlot="fill-option-grid"
          gridClassName="dn-fill-option-grid"
        >
          <Options />
        </SettingsOptionShelf>
      </MobileInspectorDensityContext.Provider>,
    );

    expect(surface.container.querySelector('[data-slot="mobile-settings-rail"]')).toBeNull();

    const grid = surface.container.querySelector('[data-slot="fill-option-grid"]');

    expect(grid).not.toBeNull();
    expect(grid?.className).toContain("grid-cols-6");
    expect(grid?.className).toContain("dn-fill-option-grid");
    expect(grid?.getAttribute("role")).toBe("group");
  });

  it("does not force a scrollbar on horizontal rails", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileSettingsRail ariaLabel="Style options" persistKey="style-options">
          <Options />
        </MobileSettingsRail>
      </MobileInspectorDensityContext.Provider>,
    );

    const rail = surface.container.querySelector('[data-slot="mobile-settings-rail"]');

    expect(rail?.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull();
    expect(rail?.querySelector(".scroll-edge-cue-gradient")).not.toBeNull();
  });

  it("sizes landscape cards in the card rail row", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileCardRail ariaLabel="Wallpapers" persistKey="wallpapers">
          <button type="button">Wallpaper</button>
        </MobileCardRail>
      </MobileInspectorDensityContext.Provider>,
    );

    const row = surface.container.querySelector(".dn-mobile-card-rail");

    expect(row).not.toBeNull();
    expect(row?.querySelectorAll("button")).toHaveLength(1);
  });
});
