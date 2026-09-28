import { useSyncExternalStore } from "react";

const sectionTabs = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribeSectionTabs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSettingsSectionTab(sectionId: string, fallback: string) {
  return sectionTabs.get(sectionId) ?? fallback;
}

export function setSettingsSectionTab(sectionId: string, tab: string) {
  if (sectionTabs.get(sectionId) === tab) {
    return;
  }
  sectionTabs.set(sectionId, tab);
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Reactive read of a section's persisted tab. Views inside the FamilyDrawer
 * stay mounted across opens (visited views are kept alive), so a `useState`
 * snapshot of `getSettingsSectionTab` goes stale — e.g. the Logo option opens
 * the drawer but the mounted QR section still renders its last Module tab.
 */
export function useSettingsSectionTab(sectionId: string, fallback: string): string {
  return (
    useSyncExternalStore(subscribeSectionTabs, () => sectionTabs.get(sectionId) ?? null) ?? fallback
  );
}

export function resetSettingsSectionTabsForTests() {
  sectionTabs.clear();
  for (const listener of listeners) {
    listener();
  }
}
