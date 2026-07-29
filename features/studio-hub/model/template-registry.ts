import {
  AUTHORED_TEMPLATE_BUILDERS,
  buildAuthoredTemplateDocument,
} from "@/features/studio-hub/model/authored-templates"
import {
  SOCIAL_CARD_TEMPLATE_BUILDERS,
  buildSocialCardTemplateDocument,
} from "@/features/studio-hub/model/social-card-templates"
import { QR_DESIGN_TEMPLATES } from "@/features/studio-hub/model/templates"
import {
  cloneDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"

export type TemplateRegistryEntry = {
  buildDocument: () => DraftingWorkspaceDocumentV1
  id: string
  source: "authored" | "hub" | "social"
}

const authoredEntries: TemplateRegistryEntry[] = Object.keys(AUTHORED_TEMPLATE_BUILDERS).map(
  (id) => ({
    buildDocument: () => buildAuthoredTemplateDocument(id),
    id,
    source: "authored",
  }),
)

const socialEntries: TemplateRegistryEntry[] = (
  Object.keys(SOCIAL_CARD_TEMPLATE_BUILDERS) as Array<
    keyof typeof SOCIAL_CARD_TEMPLATE_BUILDERS
  >
).map((id) => ({
  buildDocument: () => buildSocialCardTemplateDocument(id),
  id,
  source: "social",
}))

const knownIds = new Set([...authoredEntries, ...socialEntries].map((entry) => entry.id))

const hubEntries: TemplateRegistryEntry[] = QR_DESIGN_TEMPLATES.filter(
  (template) => !knownIds.has(template.id),
).map((template) => ({
  buildDocument: () => cloneDraftingWorkspaceDocument(template.document),
  id: template.id,
  source: "hub",
}))

export const TEMPLATE_REGISTRY: TemplateRegistryEntry[] = [
  ...authoredEntries,
  ...socialEntries,
  ...hubEntries,
]

export function getTemplateRegistryEntry(id: string): TemplateRegistryEntry | undefined {
  return TEMPLATE_REGISTRY.find((entry) => entry.id === id)
}
