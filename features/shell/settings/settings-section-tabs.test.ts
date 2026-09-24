import { describe, expect, it } from "vitest";

import {
  getSettingsSectionTab,
  resetSettingsSectionTabsForTests,
  setSettingsSectionTab,
} from "@/features/shell/settings/settings-section-tabs";

describe("settings chrome state", () => {
  it("remembers section tabs across reads", () => {
    resetSettingsSectionTabsForTests();
    expect(getSettingsSectionTab("qr-style", "Module")).toBe("Module");

    setSettingsSectionTab("qr-style", "Logo");
    expect(getSettingsSectionTab("qr-style", "Module")).toBe("Logo");
  });
});
