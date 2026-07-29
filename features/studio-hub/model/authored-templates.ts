import { defineTemplate } from "@/features/workspace/authoring/define-template"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"

export const AUTHORED_TEMPLATE_BUILDERS: Record<string, () => DraftingWorkspaceDocumentV1> = {
  "authored-paris-ticket": defineTemplate({
    archetype: "ticket",
    data: "https://example.com/trip",
    palette: "mint",
    ratio: "ratio-4-5",
    slots: {
      action: "Reserve",
      caption: "Scan to book",
      meta: "5D 6N",
      title: "Trip to Paris",
    },
  }),

  "authored-amsterdam-label": defineTemplate({
    archetype: "label",
    data: "https://example.com/amsterdam",
    palette: "sand",
    ratio: "ratio-4-5",
    slots: {
      caption: "Scan to open",
      meta: "5D 6N · 4.61",
      title: "Trip to Amsterdam",
    },
  }),

  "authored-members-seal": defineTemplate({
    archetype: "seal",
    data: "https://example.com/members",
    palette: "blush",
    ratio: "ratio-1-1",
    slots: { caption: "Members" },
  }),
}

export function buildAuthoredTemplateDocument(id: string): DraftingWorkspaceDocumentV1 {
  const builder = AUTHORED_TEMPLATE_BUILDERS[id]

  if (!builder) {
    throw new Error(`unknown authored template: ${id}`)
  }

  return builder()
}
