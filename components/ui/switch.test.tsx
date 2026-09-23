import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Switch } from "@/components/ui/switch";

describe("Switch", () => {
  it("renders a labeled toggle with track geometry", () => {
    const markup = renderToStaticMarkup(
      <Switch checked label="Notifications" onToggle={() => {}} />,
    );

    expect(markup).toContain("Notifications");
    expect(markup).toContain("rounded-full");
    expect(markup).toContain('role="switch"');
  });
});
