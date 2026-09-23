import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { INSPECTOR_INPUT_CLASS } from "@/features/shell/components/inspector-tokens";
import {
  InspectorScrubbableNumberInput,
  InspectorTextInput,
} from "@/features/shell/components/InspectorControls";

describe("desktop inspector controls", () => {
  it("renders shared input controls with the desktop inspector class contract", () => {
    const markup = renderToStaticMarkup(
      <div>
        <InspectorTextInput aria-label="Remote logo URL" />
      </div>,
    );

    expect(markup).toContain(INSPECTOR_INPUT_CLASS);
    expect(markup).toContain("inspector-input-bg");
  });

  it("renders paste action on pasteable text inputs", () => {
    const markup = renderToStaticMarkup(
      <InspectorTextInput aria-label="Content URL" pasteable onPasteValue={vi.fn()} />,
    );

    expect(markup).toContain('data-slot="inspector-paste-action"');
    expect(markup).toContain('data-icon="a"');
    expect(markup).toContain('data-icon="b"');
    expect(markup).toContain('aria-label="Paste from clipboard"');
  });

  it("keeps a stable wrap around pasteable inputs without errors", () => {
    const markup = renderToStaticMarkup(
      <InspectorTextInput aria-label="Content URL" pasteable onPasteValue={vi.fn()} />,
    );

    expect(markup).toContain("t-input-wrap");
    expect(markup).not.toContain("t-error-msg--visible");
  });

  it("renders validation feedback without paste shake styling", () => {
    const markup = renderToStaticMarkup(
      <InspectorTextInput
        aria-label="Content URL"
        error="Enter a correct profile URL."
        pasteable
        onPasteValue={vi.fn()}
      />,
    );

    expect(markup).toContain("t-input-wrap");
    expect(markup).toContain("Enter a correct profile URL.");
    expect(markup).toContain("t-error-msg--visible");
    expect(markup).not.toContain("is-error");
    expect(markup).not.toContain("is-shaking");
  });

  it("renders scrubbable number inputs with resize cursor and scrub slot", () => {
    const markup = renderToStaticMarkup(
      <InspectorScrubbableNumberInput
        aria-label="Width"
        className="h-8 rounded-[6px] px-2"
        min={1}
        value={120}
        onValueChange={vi.fn()}
      />,
    );

    expect(markup).toContain('data-slot="inspector-scrubbable-number"');
    expect(markup).toContain("cursor-ew-resize");
    expect(markup).toContain("appearance-none");
  });
});
