import { describe, expect, it } from "vitest"

import {
  KNOWN_ISSUE_CODES,
  STRICT_TEMPLATE_IDS,
} from "@/features/studio-hub/model/template-validation-baseline"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

describe("template validation", () => {
  it.each(TEMPLATE_REGISTRY.map((entry) => entry.id))("%s introduces no new issues", (id) => {
    const entry = TEMPLATE_REGISTRY.find((candidate) => candidate.id === id)!
    const issues = validateTemplateDocument(entry.buildDocument())
    const allowed = new Set(KNOWN_ISSUE_CODES[id] ?? [])
    const unexpected = issues.filter((issue) => !allowed.has(issue.code))

    expect(
      unexpected.map((issue) => `${issue.code} ${issue.layerId ?? "-"}: ${issue.message}`),
    ).toEqual([])
  })

  it.each(STRICT_TEMPLATE_IDS.length > 0 ? STRICT_TEMPLATE_IDS : ["__none__"])(
    "%s is completely clean",
    (id) => {
      if (id === "__none__") {
        expect(STRICT_TEMPLATE_IDS).toEqual([])
        return
      }

      const entry = TEMPLATE_REGISTRY.find((candidate) => candidate.id === id)!
      const issues = validateTemplateDocument(entry.buildDocument())

      expect(issues.map((issue) => `${issue.code}: ${issue.message}`)).toEqual([])
    },
  )
})
