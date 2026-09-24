// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultCanvasWorkspaceDocument } from "@/features/canvas/model/document";
import { writeCanvasWorkspaceDraft } from "@/features/canvas/model/storage";
import { resolveWorkspaceBootstrapDocument } from "@/features/canvas/model/workspace-bootstrap";

describe("resolveWorkspaceBootstrapDocument", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMemoryStorage(),
    });
    vi.restoreAllMocks();
  });

  it("returns the persisted draft when one exists", async () => {
    const seeded = createDefaultCanvasWorkspaceDocument();
    const nodeId = seeded.activeQrNodeId;

    await writeCanvasWorkspaceDraft(seeded);

    const result = await resolveWorkspaceBootstrapDocument();

    expect(result.layerStateByNodeId[nodeId]?.length).toBe(
      seeded.layerStateByNodeId[nodeId]?.length,
    );
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}
