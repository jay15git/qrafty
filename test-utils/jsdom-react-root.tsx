import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, vi } from "vitest";

const cleanupCallbacks: Array<() => void | Promise<void>> = [];

afterEach(async () => {
  for (const cleanup of cleanupCallbacks.splice(0)) {
    await cleanup();
  }

  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

export function renderWithJsdomRoot(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);

  let root: Root | null = null;

  act(() => {
    root = createRoot(container);
    root.render(element);
  });

  cleanupCallbacks.push(() => {
    act(() => {
      root?.unmount();
    });
    container.remove();
  });

  return {
    container,
    rerender(nextElement: ReactElement) {
      act(() => {
        root?.render(nextElement);
      });
    },
  };
}

export async function renderWithAsyncJsdomRoot(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);

  let root: Root | null = null;

  await act(async () => {
    root = createRoot(container);
    root.render(element);
  });

  cleanupCallbacks.push(async () => {
    await act(async () => {
      root?.unmount();
    });
    container.remove();
  });

  return { container };
}
