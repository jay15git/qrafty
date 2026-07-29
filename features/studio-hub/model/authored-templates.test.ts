import { describe, expect, it } from "vitest"

import {
  AUTHORED_TEMPLATE_BUILDERS,
  buildAuthoredTemplateDocument,
} from "@/features/studio-hub/model/authored-templates"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

const IDS = Object.keys(AUTHORED_TEMPLATE_BUILDERS)

describe("authored templates", () => {
  it("exposes three authored templates", () => {
    expect(IDS).toEqual([
      "authored-paris-ticket",
      "authored-amsterdam-label",
      "authored-members-seal",
    ])
  })

  it.each(IDS)("%s validates clean", (id) => {
    const issues = validateTemplateDocument(buildAuthoredTemplateDocument(id))

    expect(issues.map((issue) => `${issue.severity} ${issue.code}: ${issue.message}`)).toEqual([])
  })

  it.each(IDS)("%s is in the registry", (id) => {
    expect(TEMPLATE_REGISTRY.map((entry) => entry.id)).toContain(id)
  })

  it("has retired the course drop template", () => {
    expect(TEMPLATE_REGISTRY.map((entry) => entry.id)).not.toContain("social-course-drop")
  })
})
