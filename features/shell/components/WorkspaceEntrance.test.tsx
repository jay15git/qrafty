/**
 * @vitest-environment jsdom
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceEntrance } from "@/features/shell/components/WorkspaceEntrance";

function mount(ui: React.ReactNode, container: HTMLElement): { root: Root; unmount: () => void } {
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe("WorkspaceEntrance", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    container.remove();
  });

  it("stays loading until the workspace canvas is ready", () => {
    mount(
      <WorkspaceEntrance theme="dark">
        <div data-slot="canvas-workspace-loading">Loading</div>
      </WorkspaceEntrance>,
      container,
    );

    const root = document.querySelector('[data-slot="entrance-root"]');
    expect(root?.getAttribute("data-entrance")).toBe("loading");
  });

  it("reveals once canvas-root is mounted and loading is gone", () => {
    mount(
      <WorkspaceEntrance theme="dark">
        <div data-slot="canvas-root">Canvas</div>
      </WorkspaceEntrance>,
      container,
    );

    const root = document.querySelector('[data-slot="entrance-root"]');
    expect(root?.getAttribute("data-entrance")).toBe("revealing");
  });

  it("marks the entrance done after the staggered reveal window", () => {
    vi.useFakeTimers();

    mount(
      <WorkspaceEntrance theme="light">
        <div data-slot="canvas-root">Canvas</div>
      </WorkspaceEntrance>,
      container,
    );

    act(() => {
      vi.advanceTimersByTime(950);
    });

    const root = document.querySelector('[data-slot="entrance-root"]');
    expect(root?.getAttribute("data-entrance")).toBe("done");
  });
});
