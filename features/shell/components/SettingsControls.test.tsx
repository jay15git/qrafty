import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SETTINGS_INPUT_CLASS } from "@/features/shell/components/settings-tokens";
import {
  SettingsScrubbableNumberInput,
  SettingsTextInput,
} from "@/features/shell/components/SettingsControls";

describe("desktop settings controls", () => {
  it("renders shared input controls with the desktop settings class contract", () => {
    const markup = renderToStaticMarkup(
      <div>
        <SettingsTextInput aria-label="Remote logo URL" />
      </div>,
    );

    expect(markup).toContain(SETTINGS_INPUT_CLASS);
    expect(markup).toContain("ds-input-bg");
  });

  it("renders paste action on pasteable text inputs", () => {
    const markup = renderToStaticMarkup(
      <SettingsTextInput aria-label="Content URL" pasteable onPasteValue={vi.fn()} />,
    );

    expect(markup).toContain('data-slot="settings-paste-action"');
    expect(markup).toContain('data-icon="a"');
    expect(markup).toContain('data-icon="b"');
    expect(markup).toContain('aria-label="Paste from clipboard"');
  });

  it("keeps a stable wrap around pasteable inputs without errors", () => {
    const markup = renderToStaticMarkup(
      <SettingsTextInput aria-label="Content URL" pasteable onPasteValue={vi.fn()} />,
    );

    expect(markup).toContain("ds-input-wrap");
    expect(markup).not.toContain("ds-error-msg--visible");
  });

  it("renders validation feedback without paste shake styling", () => {
    const markup = renderToStaticMarkup(
      <SettingsTextInput
        aria-label="Content URL"
        error="Enter a correct profile URL."
        pasteable
        onPasteValue={vi.fn()}
      />,
    );

    expect(markup).toContain("ds-input-wrap");
    expect(markup).toContain("Enter a correct profile URL.");
    expect(markup).toContain("ds-error-msg--visible");
    expect(markup).not.toContain("is-error");
    expect(markup).not.toContain("is-shaking");
  });

  it("renders scrubbable number inputs with resize cursor and scrub slot", () => {
    const markup = renderToStaticMarkup(
      <SettingsScrubbableNumberInput
        aria-label="Width"
        className="h-8 rounded-[6px] px-2"
        min={1}
        value={120}
        onValueChange={vi.fn()}
      />,
    );

    expect(markup).toContain('data-slot="settings-scrubbable-number"');
    expect(markup).toContain("cursor-ew-resize");
    expect(markup).toContain("appearance-none");
  });
});
