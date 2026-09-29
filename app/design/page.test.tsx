import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

vi.mock("@/features/shell/components/Workspace", () => ({
  Workspace: (props: { fontClassName?: string }) => (
    <div data-testid="workspace" data-font-class-name={props.fontClassName} />
  ),
}));

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "mock-satoshi-font",
  }),
}));

import { Workspace } from "@/features/shell/components/Workspace";
import DesktopPage, { metadata } from "./page";

const page = (source?: string) =>
  DesktopPage({ searchParams: Promise.resolve(source === undefined ? {} : { source }) });

describe("desktop page", () => {
  it("exposes metadata for the design workspace", () => {
    expect(metadata.title).toBe("Design QR");
    expect(metadata.description).toContain("floating toolbar");
  });

  it("renders the workspace inside the route shell", async () => {
    const main = await page();

    expect(isValidElement(main)).toBe(true);
    expect(main.type).toBe("main");
    expect(main.props.className).toContain("mock-satoshi-font");
    expect(main.props.className).toContain("h-dvh");
    expect(main.props["data-slot"]).toBe("design-page");

    const workspace = main.props.children;
    expect(isValidElement(workspace)).toBe(true);
    expect(workspace.type).toBe(Workspace);
    expect(workspace.props.fontClassName).toBe("mock-satoshi-font");
    expect(workspace.props.initialTheme).toBe("dark");
  });

  it.each([
    ["prompt", "content"],
    ["blank", "content"],
    [undefined, undefined],
    ["gallery", undefined],
  ] as const)("maps source=%s to initialActiveTool=%s", async (source, expected) => {
    const main = await page(source);
    expect(main.props.children.props.initialActiveTool).toBe(expected);
  });
});
