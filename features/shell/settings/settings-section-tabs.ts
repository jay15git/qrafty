const sectionTabs = new Map<string, string>();

export function getSettingsSectionTab(sectionId: string, fallback: string) {
  return sectionTabs.get(sectionId) ?? fallback;
}

export function setSettingsSectionTab(sectionId: string, tab: string) {
  sectionTabs.set(sectionId, tab);
}

export function resetSettingsSectionTabsForTests() {
  sectionTabs.clear();
}
