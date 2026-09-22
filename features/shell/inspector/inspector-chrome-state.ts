const sectionTabs = new Map<string, string>()

export function getInspectorSectionTab(sectionId: string, fallback: string) {
  return sectionTabs.get(sectionId) ?? fallback
}

export function setInspectorSectionTab(sectionId: string, tab: string) {
  sectionTabs.set(sectionId, tab)
}

export function resetInspectorChromeStateForTests() {
  sectionTabs.clear()
}
